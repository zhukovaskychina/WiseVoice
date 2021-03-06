import { Card, Col,message, Row, Input,notification } from 'antd';
import {connect, Dispatch} from 'umi';
import React, { Component } from 'react';

// @ts-ignore
import Recorder from 'recorderjs';
import { GridContent } from '@ant-design/pro-layout';
import { AudioOutlined } from '@ant-design/icons';
import { StateType } from './model';

const { Search } = Input;
interface VoiceMonitorProps {
  dashboardVoice: StateType;
  dispatch: Dispatch<any>;
  loading: boolean;
  onEnd:any;
}

const suffix = (
  <AudioOutlined
    style={{
      fontSize: 16,
      color: '#1890ff',
    }}
  />
);


class Monitor extends Component<VoiceMonitorProps> {
  recorder: any;
  timer:any;
  globalValue:number;
  audio_context:AudioContext;
  isEven:number;
  constructor() {
    super();
    this.state={
      isRecording:false,
      textSearchValue:""
    };
    this.socket = null;
  };


  componentWillMount() {

  };
  onSearch=(value:string)=>{
    let that=this;
    if(that.globalValue===-1){
      that.audio_context = new AudioContext();
      navigator.getUserMedia({audio: true}, function(stream){
        let input = that.audio_context.createMediaStreamSource(stream);
        that.recorder = new Recorder(input);
      //  that.recorder = new Recorder(props);
        that.globalValue=1;
      }, err => {
        switch (err.message || err.name) {
          case 'PERMISSION_DENIED':
          case 'PermissionDeniedError':
            // Toast.info('用户拒绝提供信息。');
            break;
          case 'NOT_SUPPORTED_ERROR':
          case 'NotSupportedError':
            // Toast.info('浏览器不支持硬件设备。');
            break;
          case 'MANDATORY_UNSATISFIED_ERROR':
          case 'MandatoryUnsatisfiedError':
            // Toast.info('无法发现指定的硬件设备。');
            break;
          default:
            //  Toast.info('无法打开麦克风。异常信息:' + (err.code || err.name));
            break;
        }});
    }

    // @ts-ignore
    // eslint-disable-next-line eqeqeq
    if(this.globalValue===-1){
      return;
    }

    // eslint-disable-next-line eqeqeq
    if(that.isEven%2===0){
      notification.open({
        message: '系统提示',
        duration:4.5,
        description:
          '你正在录音',
        onClick: () => {
          console.log('Notification Clicked!');
        },
      });
      //  startRecording(button);
  //    that.handleTouchStart();

      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      that.recorder && that.recorder.record();
    }else{
      notification.open({
        message: '系统提示',
        duration:4.5,
        description:
          '你已经结束录音',
        onClick: () => {
          console.log('Notification Clicked!');
        },
      });
      //结束录音
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      that.recorder && that.recorder.stop();
      that.uploadWavFile();
      that.recorder.clear();
    }

    that.isEven++;


  };
  uploadWavFile=()=> {
    let that=this;
    that.recorder && that.recorder.exportWAV(function(blob: any) {
      console.log(blob);
      var stringFile=new Date().toISOString() + '.wav';
      console.log("生成录音文件"+stringFile);
      var fileBlob=that.blobToFile(blob,stringFile);

      console.log(fileBlob);
      that.upload(fileBlob);
    });


  }


  //转成file
  blobToFile=(Blob, fileName) =>{
    Blob.lastModifiedDate = new Date();
    Blob.name = fileName;
    return Blob;
  }



  //文件上传
  upload=(binary)=>{
    let that=this;
    const {dispatch}=that.props;
    let formdata=new FormData();
    formdata.append("file",binary);
    // eslint-disable-next-line react-hooks/rules-of-hooks

      dispatch({
        type: 'dashboardVoice/uploadWav',
        payload: formdata,
        callback:(response)=> {
          let resultCode=response.resultCode;
          if(resultCode==="000000"){

              //socket
              that.socket.send(response.data);

          }else{
            message.error(response.resultMesg);
          }
          console.log(response);
        }
      });


  }

  handleTouchStart = () => {
    console.log("come on!!")
    let that=this;
    that.timer = setTimeout(() => {
      that.recorder.startRecord();
      this.setState({
        isRecording: true
      });
    }, 300);
  };

  handleTouchEnd = () => {
    console.log("end!!!");
    if (this.timer) {
      clearTimeout(this.timer);
    }
    let that=this;
    that.recorder.stopRecord();
    that.setState({
      isRecording: false
    }, () => {
      const { onEnd } = that.props;
      onEnd && onEnd(that.recorder.getBlob());
    });
  };
  componentDidMount(){
    const constraints = { audio: true };
    this.globalValue=-1;
    let that=this;

    that.socket = new WebSocket("wss://47.101.40.150:9000/websocket" );

    that.isEven=0;

    let self = that;


    self.socket.onopen = function()
    {
      console.log("建立链接");
    };

    self.socket.onmessage = function (evt)
    {
      var received_msg = evt.data;
      console.log(evt.data);
      let responseData=JSON.parse(evt.data);

      let eventName=responseData.eventName;
      let rsData=responseData.data;

      if(eventName==="voiceFailure"){
        message.error(rsData.resultMesg);
      }
      if(eventName==="voiceSuccess"){
        message.info(rsData.data);
      }

    };

    self.socket.onclose = function()
    {
      // 关闭 websocket
      //   alert("连接已关闭...");
    };
  }
  render() {
    const { dashboardVoice, loading } = this.props;
    const {isRecording}=this.state;

    return (
      <GridContent>
        <React.Fragment>
          <Row gutter={24}>
            <Col xl={24} lg={24} md={24} sm={24} xs={24} style={{ marginBottom: 24 }}>
              <Card title={"查询语音"}
                bordered={false}
              >
                <Search
                  placeholder="请在这里说话"
                  enterButton="查询"
                  size="large"
                  suffix={suffix}
                  onSearch={this.onSearch}
                  loading={isRecording}

                />

              </Card>
            </Col>
          </Row>
        </React.Fragment>
      </GridContent>
    );
  }
}

export default connect(
  ({
    dashboardVoice,
    loading,
  }: {
    dashboardVoice: StateType;
    loading: {
      models: { [key: string]: boolean };
    };
  }) => ({
    dashboardVoice,
    loading: loading.models.dashboardVoice,
  }),
)(Monitor);
