<template>
  <div>
    <div class="content">
      <button v-on:click="scan">{{ isScan ? "Stop" : "Scan" }}</button>
      <div>barcode: {{ isbn }}</div>
    </div>
    <div class="content">
      <button v-on:click="save">
        Save
      </button>
      <div>{{ status }}</div>
    </div>
    <div class="scan-content" v-show="isScan">
      <div id="interactive" class="viewport"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import * as Quagga from "quagga";
import axios from "axios";
import { Book } from "../book";

@Component({})
export default class Scan extends Vue {
  $gapi: any;
  isScan = false;
  spreadsheetId: string | null = "";
  isbn: string | null = null;
  book: Book | null = null;
  status = "";

  created() {
    this.spreadsheetId = localStorage.getItem("scan-book.spreadsheetId");
  }

  scan() {
    this.isScan = !this.isScan;
    if (!this.isScan) {
      Quagga.stop();
      return;
    }
    Quagga.init(
      {
        inputStream: {
          type: "LiveStream",
          constraints: {
            width: { min: 640 },
            height: { min: 480 }
          }
        },
        numOfWorkers: 1,
        frequency: 10,
        decoder: {
          readers: ["ean_reader"]
        }
      },
      function(err: any) {
        if (err) {
          console.error(err);
          return;
        }
        Quagga.start();
      }
    );
    Quagga.onDetected((result: { codeResult: { code: any } }) => {
      const code = result.codeResult.code;
      if (this.isbn !== code) {
        this.isbn = code;
      }
    });
    Quagga.onProcessed(function(result: {
      boxes: any[];
      box: any;
      codeResult: { code: any };
      line: any;
    }) {
      const drawingCtx = Quagga.canvas.ctx.overlay,
        drawingCanvas = Quagga.canvas.dom.overlay;
      if (result) {
        if (result.boxes) {
          drawingCtx.clearRect(
            0,
            0,
            parseInt(drawingCanvas.getAttribute("width"), 10),
            parseInt(drawingCanvas.getAttribute("height"), 10)
          );
        }
        if (result.codeResult && result.codeResult.code) {
          Quagga.ImageDebug.drawPath(
            result.line,
            { x: "x", y: "y" },
            drawingCtx,
            { color: "red", lineWidth: 3 }
          );
        }
      }
    });
  }

  async save() {
    if (!this.isbn) {
      return;
    }
    await this.search();
    const gapi = await this.$gapi.getGapiClient();
    if (!this.spreadsheetId) {
      const res = await gapi.client.sheets.spreadsheets.create({
        properties: {
          title: "scan-book-data"
        }
      });
      this.spreadsheetId = res.result.spreadsheetId;
      localStorage.setItem(
        "scan-book.spreadsheetId",
        this.spreadsheetId as string
      );
      const values = [["タイトル", "著者", "出版社", "出版日"]];
      await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: "A1",
        valueInputOption: "RAW",
        resource: {
          values
        }
      });
    }
    if (this.book) {
      const values = [
        [
          this.book.title,
          this.book.author,
          this.book.publisher,
          this.book.publishedDate
        ]
      ];
      await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: "A1",
        valueInputOption: "RAW",
        resource: {
          values
        }
      });
      this.status = "saved";
      setTimeout(() => {
        this.status = "";
      }, 3000);
    } else {
      this.status = "no data";
      setTimeout(() => {
        this.status = "";
      }, 3000);
    }
  }

  private async search() {
    this.book = null;
    const isbn = this.isbn;
    const res = (await axios.get(
      "https://www.googleapis.com/books/v1/volumes",
      {
        params: {
          q: `isbn:${isbn}`,
          country: "no"
        }
      }
    )) as any;
    if (res && res.data && res.data.items) {
      const data = res.data.items;
      this.book = {
        title: data[0].volumeInfo.title,
        author: (data[0].volumeInfo.authors as string[]).join(","),
        publisher: data[0].volumeInfo.publisher,
        publishedDate: data[0].volumeInfo.publishedDate
      };
    }
    if (!this.book) {
      const res = (await axios.get("https://api.openbd.jp/v1/get", {
        params: {
          isbn
        }
      })) as any;
      if (res && res.data && res.data.data) {
        const data = res.data.data;
        this.book = {
          title: data[0].summary.title,
          author: data[0].summary.author,
          publisher: data[0].summary.publisher,
          publishedDate: data[0].summary.pubdate
        };
      }
    }
  }
}
</script>

<style>
button {
  width: 100px;
  height: 60px;
  font-size: 20px;
}

div.content {
  margin: 50px 0;
}

.scan-content {
  display: flex;
  justify-content: center;
}

#interactive.viewport {
  position: relative;
  width: 640px;
  height: 480px;
}

@media screen and (min-width: 0px) and (max-width: 480px) {
  #interactive.viewport {
    position: relative;
    width: 320px;
    height: 240px;
  }
}

canvas.drawingBuffer {
  position: absolute;
  left: 0;
  top: 0;
}

@media screen and (min-width: 0px) and (max-width: 480px) {
  canvas.drawingBuffer {
    position: absolute;
    left: 0;
    top: 0;
    width: 320px;
    height: 240px;
  }
  video {
    width: 320px;
    height: 240px;
  }
}
</style>
