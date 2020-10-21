import { Card, Tabs } from 'antd';
import { formatMessage } from 'umi';
import React from 'react';
import { OfflineChartData, OfflineDataType } from '../data.d';

import { TimelineChart } from './Charts';
import styles from '../style.less';

const { TabPane } = Tabs;

const OfflineData = ({
  activeKey,
  loading,
  offlineData,
  offlineChartData,
  handleTabChange,
}: {
  activeKey: string;
  loading: boolean;
  offlineData: OfflineDataType[];
  offlineChartData: OfflineChartData[];
  handleTabChange: (activeKey: string) => void;
}) => (
  <Card loading={loading} className={styles.offlineCard} bordered={false} style={{ marginTop: 32 }}>
    <Tabs activeKey={activeKey} onChange={handleTabChange}>
      {offlineData.map((shop) => (
        <TabPane key={shop.name}>
          <div style={{ padding: '0 24px' }}>
            <TimelineChart
              height={400}
              data={offlineChartData}
              titleMap={{
                y1: formatMessage({ id: 'dashboardandanalysis.analysis.traffic' }),
                y2: formatMessage({ id: 'dashboardandanalysis.analysis.payments' }),
              }}
            />
          </div>
        </TabPane>
      ))}
    </Tabs>
  </Card>
);

export default OfflineData;
