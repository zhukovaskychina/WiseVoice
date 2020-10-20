import React from "react";


export interface VoiceSearchProps {
  stream: any;
  callback:any;
  context:any;
}
// recorder.js，这个是在网上找的，具体地址不记得了，这个存在一个问题就是，他分段之后会把audioData清空，导致最后结束的时候
// ，audioData是一个空值，如果需要把整段的录音转化成一个音频文件，不考虑分片的话，可以把onaudioprocess里面的sendData注释掉
// ，没错，我就是这样搞的，只需要一个完整的音频，如果需要分段传送，就把注释打开，然后作出对应的处理

const Recorder:React.FC<VoiceSearchProps>=(props)=>{



  const {stream,callback,context}=props;
  let that=this;
  const sampleBits = 16; //输出采样数位 8, 16
  const sampleRate = 8000; //输出采样率
 // const context = new AudioContext();
  const audioInput = context.createMediaStreamSource(stream);
  const recorder = context.createScriptProcessor(4096, 1, 1);
  const audioData = {
    size: 0, //录音文件长度
    buffer: [], //录音缓存
    inputSampleRate: 48000, //输入采样率
    inputSampleBits: 16, //输入采样数位 8, 16
    outputSampleRate: sampleRate, //输出采样数位
    oututSampleBits: sampleBits, //输出采样率
    clear: function () {
      this.buffer = [];
      this.size = 0;
    },
    input: function (data) {
      this.buffer.push(new Float32Array(data));
      this.size += data.length;
    },
    compress: function () { //合并压缩
      //合并
      const data = new Float32Array(this.size);
      let offset = 0;
      for (let i = 0; i < this.buffer.length; i++) {
        data.set(this.buffer[i], offset);
        offset += this.buffer[i].length;
      }
      //压缩
      const compression = parseInt(this.inputSampleRate / this.outputSampleRate);
      const length = data.length / compression;
      const result = new Float32Array(length);
      let index = 0,
        j = 0;
      while (index < length) {
        result[index] = data[j];
        j += compression;
        index++;
      }
      return result;
    },
    encodePCM: function () { //这里不对采集到的数据进行其他格式处理，如有需要均交给服务器端处理。
      const sampleRate = Math.min(this.inputSampleRate, this.outputSampleRate);
      const sampleBits = Math.min(this.inputSampleBits, this.oututSampleBits);
      const bytes = this.compress();
      const dataLength = bytes.length * (sampleBits / 8);
      const buffer = new ArrayBuffer(dataLength);
      const data = new DataView(buffer);
      let offset = 0;
      for (let i = 0; i < bytes.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, bytes[i]));
        data.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      }
      return new Blob([data], { 'type': 'audio/pcm' });
    }
  };

  const sendData = function () { //对以获取的数据进行处理(分包)
    const reader = new FileReader();
    reader.onload = e => {
      const outbuffer = e.target.result;
      // callback && callback(outbuffer);
      const arr = new Int8Array(outbuffer);
      if (arr.length > 0) {
        let tmparr = new Int8Array(1024);
        let j = 0;
        for (let i = 0; i < arr.byteLength; i++) {
          tmparr[j++] = arr[i];
          if (((i + 1) % 1024) == 0) {
            callback && callback(tmparr);
            if (arr.byteLength - i - 1 >= 1024) {
              tmparr = new Int8Array(1024);
            } else {
              tmparr = new Int8Array(arr.byteLength - i - 1);
            }
            j = 0;
          }
          if ((i + 1 == arr.byteLength) && ((i + 1) % 1024) != 0) {
            callback && callback(tmparr);
          }
        }
      }
    };
    reader.readAsArrayBuffer(audioData.encodePCM());
    audioData.clear();//每次发送完成则清理掉旧数据
  };


  const startRecord = function () {
    audioInput.connect(recorder);
    recorder.connect(context.destination);
  }

  const stopRecord = function () {
    recorder.disconnect();
  }

  const getBlob = function () {
    return audioData.encodePCM();
  }

  const clear = function () {
    audioData.clear();
  }


  recorder.onaudioprocess = function (e) {
    const inputBuffer = e.inputBuffer.getChannelData(0);
    audioData.input(inputBuffer);
    // sendData();
  }


  return function() {

  }
};



export default Recorder;
