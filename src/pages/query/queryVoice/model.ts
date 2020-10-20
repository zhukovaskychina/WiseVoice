import { Effect, Reducer } from 'umi';

import { TagType } from './data.d';
import { queryTags ,updateWavFile} from './service';

export interface StateType {
  tags: TagType[];
}

export interface ModelType {
  namespace: string;
  state: StateType;
  effects: {
    fetchTags: Effect;
  };
  reducers: {
    saveTags: Reducer<StateType>;
  };
}

const Model: ModelType = {
  namespace: 'dashboardVoice',

  state: {
    tags: [],
  },

  effects: {
    *fetchTags(_, { call, put }) {
      const response = yield call(queryTags);
      yield put({
        type: 'saveTags',
        payload: response.list,
      });
    },
    *uploadWav({ payload,callback }, { call, put }) {
      const response = yield call(updateWavFile,payload);
      yield put({
        type: 'saveTags',
        payload: response.list,
      });
      if(callback){
        callback(response);
      }
    },
  },

  reducers: {
    saveTags(state, action) {
      return {
        ...state,
        tags: action.payload,
      };
    },
  },
};

export default Model;
