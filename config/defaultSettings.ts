import { Settings as ProSettings } from '@ant-design/pro-layout';

type DefaultSettings = ProSettings & {
  pwa: boolean;
};

const proSettings: DefaultSettings = {

  "navTheme": "light",
  "primaryColor": "#1890ff",
  "layout": "top",
  "contentWidth": "Fluid",
  "fixedHeader": true,
  "fixSiderbar": false,
  "menu": {
  "locale": true
  },
  "title": "语音识别",
  "pwa": false,
  "iconfontUrl": "",
  "splitMenus": false,
  "headerRender": false
};

export type { DefaultSettings };

export default proSettings;
