<template>
  <div class="home" style="margin:1vw;">
    <Button type="success" @click="getPermission()" style="margin:1vw;">获取麦克风权限</Button>
    <br />
    <Button type="info" @click="startRecorder()" style="margin:1vw;">开始录音</Button>
    <Button type="info" @click="resumeRecorder()" style="margin:1vw;">继续录音</Button>
    <Button type="info" @click="pauseRecorder()" style="margin:1vw;">暂停录音</Button>
    <Button type="info" @click="stopRecorder()" style="margin:1vw;">结束录音go</Button>
    <br />
    <div>
      <canvas width="400px" height="100px" id="canvas"></canvas>
    </div>
    <div>
      <audio :src="luyinurlplay" controls></audio>
    </div>
  </div>
</template>
<script>
import Recorder from "js-audio-recorder";
let lamejs = require("lamejs");
export default {
  name: "home",
  data() {
    return {
      oCanvas: null,
      drawRecordId: null,
      ctx: null,
      luyinurlplay: "",
      recoderluyin: null,
      isluying: false
    };
  },
  methods: {
    initAudio() {
      if (
        navigator.mediaDevices ||
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia
      ) {
        return true
      } else {
        return false
      }
    },
    startRecorder() {
      let aa = this.initAudio()  
      console.log(aa);
      if (!aa) {
        console.log("ccc");
        return
      }
      this.recoderluyin = new Recorder({
        sampleBits: 16, // 采样位数，支持 8 或 16，默认是16
        sampleRate: 16000, // 采样率，支持 11025、16000、22050、24000、44100、48000，根据浏览器默认值，我的chrome是48000
        numChannels: 1 // 声道，支持 1 或 2， 默认是1
      });
      this.recoderluyin.start().then(
        () => {
          this.isluying = true
          this.drawRecord();
        },
        error => {
          // 出错了
          console.log(`${error.name} : ${error.message}`);
        }
      );
    },
    // 结束录音
    stopRecorder() {
      this.recoderluyin.stop();
      this.getMp3Data();
      this.getRecorder();
      this.recoderluyin.destroy();
      this.recoderluyin = null;
      this.isluying = false
    },
    getRecorder() {
      let toltime = this.recoderluyin.duration; //录音总时长
      let fileSize = this.recoderluyin.fileSize; //录音总大小
      console.log(fileSize);
      //录音结束，获取取录音数据
      let PCMBlob = this.recoderluyin.getPCMBlob(); //获取 PCM 数据
      let wav = this.recoderluyin.getWAVBlob(); //获取 WAV 数据
      let channel = this.recoderluyin.getChannelData(); //获取左声道和右声道音频数据
    },
    /**
     * 文件格式转换 wav-map3
     * */
    getMp3Data() {
      const mp3Blob = this.convertToMp3(this.recoderluyin.getWAV());
      console.log(mp3Blob)
      this.blobToDataURL(mp3Blob);
    },
    blobToDataURL(blob) {
      let a = new FileReader();
      let that = this;
      a.readAsDataURL(blob);
      a.onload = function(e) {
        that.luyinurlplay = e.target.result;
      };
    },
    convertToMp3(wavDataView) {
      // 获取wav头信息
      const wav = lamejs.WavHeader.readHeader(wavDataView); // 此处其实可以不用去读wav头信息，毕竟有对应的config配置
      const { channels, sampleRate } = wav;
      const mp3enc = new lamejs.Mp3Encoder(channels, sampleRate, 128);
      // 获取左右通道数据
      const result = this.recoderluyin.getChannelData();
      const buffer = [];

      const leftData =
        result.left &&
        new Int16Array(result.left.buffer, 0, result.left.byteLength / 2);
      const rightData =
        result.right &&
        new Int16Array(result.right.buffer, 0, result.right.byteLength / 2);
      const remaining = leftData.length + (rightData ? rightData.length : 0);

      const maxSamples = 1152;
      for (let i = 0; i < remaining; i += maxSamples) {
        const left = leftData.subarray(i, i + maxSamples);
        let right = null;
        let mp3buf = null;

        if (channels === 2) {
          right = rightData.subarray(i, i + maxSamples);
          mp3buf = mp3enc.encodeBuffer(left, right);
        } else {
          mp3buf = mp3enc.encodeBuffer(left);
        }

        if (mp3buf.length > 0) {
          buffer.push(mp3buf);
        }
      }

      const enc = mp3enc.flush();

      if (enc.length > 0) {
        buffer.push(enc);
      }
      return new Blob(buffer, { type: "audio/mp3" });
    },
    drawRecord() {
      if (!this.isluying) return
      this.oCanvas = document.getElementById("canvas");
      this.ctx = this.oCanvas.getContext("2d");
      this.drawRecordId = requestAnimationFrame(this.drawRecord);
      let dataArray = this.recoderluyin.getRecordAnalyseData(),
        bufferLength = dataArray.length;
      this.ctx.fillStyle = "rgb(255, 255, 255)";
      this.ctx.fillRect(0, 0, this.oCanvas.width, this.oCanvas.height);
      this.ctx.lineWidth = 2;
      this.ctx.fillRect(0, 0, this.oCanvas.width, this.oCanvas.height);
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = "rgb(145, 109, 64)";
      this.ctx.beginPath();
      let sliceWidth = (this.oCanvas.width * 5.0) / bufferLength,
        x = 0;
      for (let i = 0; i < bufferLength; i++) {
        let v = dataArray[i] / 128.0;
        let y = (v * this.oCanvas.height) / 2;
        if (i === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      this.ctx.lineTo(this.oCanvas.width, this.oCanvas.height / 2);
      this.ctx.stroke();
    }
  }
};
</script>