import { Col, message, Row, notification, Button, Card } from 'antd';
import { connect, Dispatch } from 'umi';
import React, { Component } from 'react';
import Index from '../../../assets/index.png';
import voiceButtonWhite from '../../../assets/voiceButtonWhite.png';
import bg from '../../../assets/bg.png';
import { G2, Chart, Tooltip, Interval, Line, Point } from 'bizcharts';
import { CloseOutlined } from '@ant-design/icons';

// @ts-ignore
import Recorder from 'recorderjs';
import { GridContent } from '@ant-design/pro-layout';
import { StateType } from './model';
import { MiniBar, TimelineChart } from '@/pages/dashboard/analysis/components/Charts';
import { formatMessage } from '@@/plugin-locale/localeExports';

interface VoiceMonitorProps {
  dashboardVoice: StateType;
  dispatch: Dispatch<any>;
  loading: boolean;
  onEnd: any;
}

interface VoiceMonitorState {
  isRecording: boolean;
  textSearchValue: string;
  chartData: any;
  showChart: boolean;
  chat: string;
}

var contentStyle = {
  width: 'auto',
  height: '100vh',
  backgroundImage: `url(${Index})`,
  backgroundSize: '100% 100%',
};

var resultStyle = {
  width: 'auto',
  height: '100vh',
  backgroundImage: `url(${bg})`,
  backgroundSize: '100% 100%',
};

class Monitor extends Component<VoiceMonitorProps, VoiceMonitorState> {
  recorder: any;
  timer: any;
  globalValue: number;
  audio_context: AudioContext;
  isEven: number;

  constructor() {
    super();
    this.state = {
      isRecording: false,
      textSearchValue: '',
      chartData: null,
      showChart: false,
      chat: '',
    };
    this.socket = null;
  }

  componentWillMount() {}

  checkoutStatus = () => {
    this.setState({ showChart: false });
  };

  onSearch = () => {
    let that = this;
    if (that.globalValue === -1) {
      that.audio_context = new AudioContext();
      navigator.getUserMedia(
        { audio: true },
        function (stream) {
          let input = that.audio_context.createMediaStreamSource(stream);
          that.recorder = new Recorder(input);
          //  that.recorder = new Recorder(props);
          that.globalValue = 1;
        },
        (err) => {
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
          }
        },
      );
    }

    // @ts-ignore
    // eslint-disable-next-line eqeqeq
    if (this.globalValue === -1) {
      return;
    }

    // eslint-disable-next-line eqeqeq
    if (that.isEven % 2 === 0) {
      notification.open({
        message: '系统提示',
        duration: 4.5,
        description: '你正在录音',
        onClick: () => {
          console.log('Notification Clicked!');
        },
      });
      //  startRecording(button);
      //    that.handleTouchStart();

      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      that.recorder && that.recorder.record();
    } else {
      notification.open({
        message: '系统提示',
        duration: 4.5,
        description: '你已经结束录音',
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
  uploadWavFile = () => {
    let that = this;
    that.recorder &&
      that.recorder.exportWAV(function (blob: any) {
        var stringFile = new Date().toISOString() + '.wav';
        console.log('生成录音文件' + stringFile);
        var fileBlob = that.blobToFile(blob, stringFile);

        that.upload(fileBlob);
      });
  };

  //转成file
  blobToFile = (Blob, fileName) => {
    Blob.lastModifiedDate = new Date();
    Blob.name = fileName;
    return Blob;
  };

  //文件上传
  upload = (binary) => {
    let that = this;
    const { dispatch } = that.props;
    let formdata = new FormData();
    formdata.append('file', binary);
    // eslint-disable-next-line react-hooks/rules-of-hooks

    dispatch({
      type: 'dashboardVoice/uploadWav',
      payload: formdata,
      callback: (response) => {
        let resultCode = response.resultCode;
        if (resultCode === '000000') {
          //socket
          that.socket.send(response.data);
        } else {
          message.error(response.resultMesg);
        }
        console.log(response);
      },
    });
  };

  // 获取图表数据
  getChartData = (context) => {
    let that = this;
    const { dispatch } = that.props;
    // eslint-disable-next-line react-hooks/rules-of-hooks

    dispatch({
      type: 'dashboardVoice/getChartData',
      payload: context,
      callback: (response) => {
        this.setState({ chartData: response, showChart: true });
      },
    });
  };

  handleTouchStart = () => {
    console.log('come on!!');
    let that = this;
    that.timer = setTimeout(() => {
      that.recorder.startRecord();
      this.setState({
        isRecording: true,
      });
    }, 300);
  };

  handleTouchEnd = () => {
    console.log('end!!!');
    if (this.timer) {
      clearTimeout(this.timer);
    }
    let that = this;
    that.recorder.stopRecord();
    that.setState(
      {
        isRecording: false,
      },
      () => {
        const { onEnd } = that.props;
        onEnd && onEnd(that.recorder.getBlob());
      },
    );
  };

  componentDidMount() {
    const constraints = { audio: true };
    this.globalValue = -1;
    let that = this;

    that.socket = new WebSocket('wss://47.101.40.150:9000/websocket');

    that.isEven = 0;

    let self = that;

    self.socket.onopen = function () {
      console.log('建立链接');
    };

    self.socket.onmessage = function (evt) {
      // var received_msg = evt.data;
      console.log(evt.data);
      let responseData = JSON.parse(evt.data);

      let eventName = responseData.eventName;
      let rsData = responseData.data;

      if (eventName === 'voiceFailure') {
        message.error(rsData.resultMesg);
        message.error('语音识别失败');
      }
      if (eventName === 'voiceSuccess') {
        message.info(rsData.data);

        console.log(rsData.data);
        let context = { text: rsData.data.Result };
        //      let context = { text: '中国和美国疫情趋势' };
        // 文字
        // let context = {'text': "上海疫情"}
        // 图片
        // let context = {'text': "上海疫情趋势"}

        self.getChartData(context);

        // 跳转图表展示
        self.setState({ showChart: true, chat: rsData.data.statusStr });
      }
      self.socket.onclose = function () {
        // 关闭 websocket
        //   alert("连接已关闭...");
      };
      // 折线
    };
  }

  render() {
    const { dashboardVoice, loading } = this.props;
    const { isRecording, chartData, chat } = this.state;
    const LineChart = function LineChart() {
      return (
        <Chart
          scale={{ value: { min: 0 } }}
          padding={[10, 10, 10, 10]}
          autoFit
          height={320}
          data={chartData.data.content}
        >
          <Line shape="smooth" position="date*value" color="date" label="value" />
          <Point position="date*value" color="region" />
        </Chart>
      );
    };
    return (
      <GridContent>
        <React.Fragment>
          {this.state.showChart ? (
            <div style={resultStyle}>
              <div style={{ padding: '10px', fontSize: '1.3rem' }}>
                <p style={{ color: '#fff' }}>{chat}</p>
                {chat && (
                  <p style={{ textAlign: 'right', color: 'cadetblue' }}>小巴帮你查询到以下结果</p>
                )}
              </div>
              {/*<Button
                type="primary"
                icon={<CloseOutlined />}
                size={'large'}
                shape="circle"
                style={{ float: 'right', zIndex: 100 }}
                onClick={() => {
                  this.checkoutStatus();
                }}
              />*/}

              {chartData.form == 'Data-list' ? (
                <div>
                  {chartData.data['Display-form'] == 0 ? (
                    <div>
                      <TimelineChart
                        height={400}
                        data={chartData.data.content}
                        titleMap={{
                          y1: formatMessage({ id: 'dashboardandanalysis.analysis.traffic' }),
                          y2: formatMessage({ id: 'dashboardandanalysis.analysis.payments' }),
                        }}
                      />
                    </div>
                  ) : (
                    <div>
                      <Card>
                        <Chart height={400} padding="auto" data={chartData.data.content} autoFit>
                          <Interval
                            adjust={[
                              {
                                type: 'dodge',
                                marginRatio: 0,
                              },
                            ]}
                            color="rigion"
                            position="date * value"
                          />
                          <Tooltip shared />
                        </Chart>
                      </Card>
                    </div>
                  )}
                </div>
              ) : chartData.form == 'Announcement' ? (
                <div>
                  <Card>{chartData.data.content}</Card>
                </div>
              ) : chartData.form == 'Picture' ? (
                <div>
                  <Card>
                    <img
                      src={'data:image/gif;base64,' + `${chartData.data.content}`}
                      alt=""
                      style={{ width: '100%' }}
                    />
                  </Card>
                </div>
              ) : (
                <div>出错了哦</div>
              )}
            </div>
          ) : (
            <div style={contentStyle}>
              <Row gutter={24}>
                <Col xl={24} lg={24} md={24} sm={24} xs={24} style={{ marginBottom: 24 }}>
                  <div
                    style={{
                      position: 'fixed',
                      bottom: '30px',
                      backgroundImage: `url(${voiceButtonWhite})`,
                      backgroundSize: 'cover',
                      width: '25vw',
                      height: '25vw',
                      marginLeft: '37vw',
                    }}
                  >
                    <Button
                      shape="circle"
                      onClick={() => {
                        this.onSearch();
                      }}
                      type="dashed"
                      style={{
                        width: '100%',
                        height: '100%',
                        color: 'transparent',
                        backgroundColor: 'transparent',
                        border: 'null',
                      }}
                    >
                      T
                    </Button>
                  </div>
                </Col>
              </Row>
            </div>
          )}
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
