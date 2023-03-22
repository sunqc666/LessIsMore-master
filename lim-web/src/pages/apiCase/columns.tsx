import {
  API_HEADER,
  API_HOST,
  API_VAR,
  PATCH,
  STATUS_2_COLOR,
  STATUS_LABEL,
  STEP_TYPE_LABEL,
  SUCCESS_STATUS,
} from '@/utils/constant';
import { Tag, Dropdown, Switch, message, notification } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { showControllerForm, showStepForm } from './func';
import { changeStepData, changeStepEnabled, copyStep, deleteStep } from '@/utils/utils';
import { runApiStep } from '@/services/apiData';
import { menuItems } from './MenuItems';
import './index.css';
export const columns = [
  {
    title: '用例名称',
    dataIndex: 'name',
    sorter: true,
    search: true,
    width: '20%',
  },
  {
    title: '修改时间',
    search: false,
    sorter: true,
    dataIndex: 'updated',
    width: '13%',
    valueType: 'dateTime',
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: '8%',
    search: false,
    filters: true,
    filterMultiple: false, //控制单选还是多选
    valueType: 'tags',
    valueEnum: STATUS_LABEL,
  },
  {
    title: '创建人',
    search: false,
    key: 'creater_name',
    dataIndex: 'creater_name',
    width: '8%',
  },
  {
    title: '修改人',
    search: false,
    dataIndex: 'updater_name',
    width: '8%',
  },
  {
    title: '执行完成时间',
    dataIndex: 'latest_run_time',
    sorter: true,
    search: false,
    width: '13%',
    valueType: 'dateTime',
  },
  {
    title: '创建时间',
    search: false,
    sorter: true,
    dataIndex: 'created',
    valueType: 'dateTime',
    width: '13%',
  },
  {
    title: '操作',
    width: '18%',
    fixed: 'right',
    dataIndex: 'option',
    valueType: 'option',
  },
];
export const stepColumns = (
  stepFormState: any,
  controllerFormState: any,
  tableState: any,
  setLoading: Function,
  hoverIndex: number,
  setHoverIndex: Function,
  onlyShow: boolean = false,
): any => [
  {
    title: '排序',
    dataIndex: 'sort',
    className: 'mouse',
    width: '5%',
    render: (_: any, rowData: any, index: number) => {
      return <span style={{ marginLeft: 6 }}>{index + 1}</span>;
    },
  },
  {
    title: '类型',
    dataIndex: 'type',
    className: 'drag-visible',
    width: '10%',
    render: (v: any, record: any) => {
      return (
        <Tag color={[API_HEADER, API_HOST, API_VAR].includes(v) ? 'green' : 'blue'}>
          {STEP_TYPE_LABEL[record.type]}
        </Tag>
      );
    },
  },
  {
    title: '名称',
    dataIndex: 'step_name',
    width: '45%',
    onCell: (_: object, index: number) => {
      return {
        onMouseEnter: () => {
          if (hoverIndex !== index) {
            setHoverIndex(index);
          }
        },
      };
    },
    render: (v: any, record: any, index: number) => {
      const items = menuItems(stepFormState, index);
      let controllerTagNodes = null;
      const labelStype = record.is_relation ? { color: STATUS_2_COLOR, fontWeight: 'bold' } : {};
      if (record.controller_data) {
        if (
          record.status != SUCCESS_STATUS &&
          typeof record.results == 'string' &&
          record.results.includes('【控制器】')
        ) {
          controllerTagNodes = (
            <Tag color="red" style={{ marginTop: 8 }}>
              {record.results}
            </Tag>
          );
        } else {
          controllerTagNodes = <Tag color="purple">含有控制器</Tag>;
        }
      }
      return (
        <>
          {record.is_relation ? <Tag color={STATUS_2_COLOR}>接口关联</Tag> : null}
          {controllerTagNodes}
          <span style={labelStype}>{v}</span>
          {!onlyShow && hoverIndex === index ? (
            <Dropdown menu={{ items }} trigger={['click']} placement="bottomLeft">
              <Tag
                color="magenta"
                className="mouse"
                style={{ float: 'right', position: 'relative', top: 12 }}
              >
                插入新步骤
              </Tag>
            </Dropdown>
          ) : null}
        </>
      );
    },
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: '10%',
    render: (v: any, record: any) => {
      const controller_data = record.controller_data;
      return (
        <>
          {controller_data?.sleep ? (
            <Tag color="blue" style={{ marginBottom: 6 }}>
              延迟{controller_data.sleep}秒执行
            </Tag>
          ) : null}
          {(controller_data && record.retried_times && (
            <Tag color="purple" style={{ marginBottom: 6 }}>
              重试{record.retried_times}次
            </Tag>
          )) ||
            null}
          <Tag color={STATUS_LABEL[v].status}>{STATUS_LABEL[v].text}</Tag>
        </>
      );
    },
  },
  {
    title: '操作',
    width: onlyShow ? '22%' : '22%',
    valueType: 'option',
    onCell: (_: object, index: number) => {
      return {
        onMouseEnter: () => {
          if (hoverIndex !== index) {
            setHoverIndex(index);
          }
        },
      };
    },
    render: (_: any, record: any) => [
      <a key="run">
        <PlayCircleOutlined
          onClick={() => {
            setLoading(true);
            const reqRecord = { ...record };
            delete reqRecord.results;
            runApiStep(reqRecord).then(
              (res) => {
                changeStepData(record.id, tableState, res);
                if (res.results.status == SUCCESS_STATUS) {
                  message.success(`步骤：${record.step_name} 执行通过！`);
                } else {
                  notification.error({
                    message: `步骤：${record.step_name} 执行失败！`,
                    description: res.msg,
                    placement: 'top',
                    duration: 3,
                    style: { width: 600 },
                  });
                }
                setLoading(false);
              },
              () => setLoading(false),
            );
          }}
        />
      </a>,
      <a
        key="1"
        onClick={async () => {
          showStepForm(stepFormState, { ...record, ...{ formType: PATCH } });
        }}
      >
        {onlyShow ? '查看' : '修改'}
      </a>,
      <a key="2" onClick={() => showControllerForm(controllerFormState, record)}>
        配置控制器
      </a>,
      onlyShow ? null : (
        <a key="copy" onClick={() => copyStep(record, tableState)}>
          复制
        </a>
      ),
      onlyShow ? null : (
        <a key="3" onClick={() => deleteStep(record.id, tableState)}>
          删除
        </a>
      ),
    ],
  },
  {
    title: '是否启用',
    dataIndex: 'enabled',
    width: '8%',
    onCell: (_: object, index: number) => {
      return {
        onMouseEnter: () => {
          if (hoverIndex !== index) {
            setHoverIndex(index);
          }
        },
      };
    },
    render: (enabled: any, record: any) => {
      return (
        <Switch checked={enabled} onChange={(checked) => changeStepEnabled(record.id, checked, tableState)} />
      );
    },
  },
];
