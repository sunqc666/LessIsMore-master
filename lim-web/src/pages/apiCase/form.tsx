import React, { useRef, useState } from 'react';
import { Button, Modal, Drawer, Dropdown, message } from 'antd';
import { ExclamationCircleTwoTone } from '@ant-design/icons';
import { ProFormCascader } from '@ant-design/pro-components';
import { API, PATCH, POST } from '@/utils/constant';
import { LimModalForm } from '@/components/limModalForm';
import DragSortTable from '@/pages/apiCase/dragSortTable';
import { ControllerForm, StepForm } from './stepForm';
import { ProjectOverview } from '../projectOverview';
import { stepColumns } from './columns';
import { DiyFormText } from '@/components/diyAntdPomponent';
import { menuItems } from './MenuItems';
import { deepCopyJsonArray } from '@/utils/utils';
const ComfirmChangeForm = ({ open, setOpen, setCaseOpen, formRef, formOk, dataSource }: any) => {
  const [loading, setLoading] = useState<boolean>(false);
  const handleCancel = () => {
    setOpen(false);
  };
  const onFinish = async () => {
    const values = formRef.current.getFieldsValue();
    if (!values['name'] || !values['module_related'].length) {
      message.error('用例名称或所属模块不能为空！');
      return;
    }
    values['steps'] = dataSource;
    setLoading(true);
    await formOk(values).then(
      () => {
        setLoading(false);
        return true;
      },
      () => {
        setLoading(false);
        return false;
      },
    );
  };
  return (
    <Modal
      open={open}
      title={
        <>
          <ExclamationCircleTwoTone twoToneColor="#FAAD14" style={{ marginRight: 6 }} />
          提示
        </>
      }
      width={300}
      onOk={onFinish}
      onCancel={handleCancel}
      footer={[
        <Button key="back" onClick={handleCancel}>
          取消
        </Button>,
        <Button
          key="noSave"
          onClick={() => {
            setCaseOpen(false);
          }}
        >
          不保存
        </Button>,
        <Button key="save" type="primary" loading={loading} onClick={onFinish}>
          保存
        </Button>,
      ]}
    >
      {' '}
      <p>你想将更改进行保存吗？</p>
    </Modal>
  );
};

export const CaseForm: React.FC<any> = ({ treeCaseModuleData, formOk, formData, ...props }) => {
  const formRef = useRef<any>();
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [stepOpen, setStepOpen] = useState<boolean>(false);
  const [stepFormData, setStepFormData] = useState<any>({}); //传递给弹窗显示的数据
  const [formWidth, setFormWidth] = useState<number>(1000);
  const [controllerFormData, setControllerFormData] = useState<any>({});
  const [controllerOpen, setControllerOpen] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<any>(deepCopyJsonArray(formData.steps));
  const [savedSource, setSavedSource] = useState<any>(deepCopyJsonArray(formData.steps));
  const [onlyButLoading, setOnlyButLoading] = useState<boolean>(false);
  const tableState = { dataSource, setDataSource };
  const controllerFormState = {
    open: controllerOpen,
    setOpen: setControllerOpen,
    formData: controllerFormData,
    setFormData: setControllerFormData,
  };
  const stepFormState = {
    open: stepOpen,
    setOpen: setStepOpen,
    formData: stepFormData,
    setFormData: setStepFormData,
    formWidth,
    setFormWidth,
  };
  const items = menuItems(stepFormState);
  return (
    <>
      <LimModalForm
        width={1200}
        extraModalProps={{ style: { top: 30 } }}
        formRef={formRef}
        title={formData.formType === POST ? '创建用例' : '修改用例'}
        initialValues={{
          name: formData.name || null,
          remark: formData.remark || null,
          module_related: formData.module_related || [],
        }}
        diyCancel={() => {
          if (JSON.stringify(savedSource) === JSON.stringify(dataSource)) {
            //是否对用例有修改
            props.setOpen(false);
          } else {
            setConfirmOpen(true);
          }
        }}
        diyOnFinish={async (values: any) => {
          values['steps'] = dataSource;
          await formOk(values).then(
            () => {
              return true;
            },
            () => {
              return false;
            },
          );
        }}
        submitter={{
          searchConfig: { submitText: '保存并关闭' },
          render: (_: any, defaultDoms: any) => {
            return [
              ...defaultDoms,
              formData.formType === PATCH ? (
                <Button
                  type="primary"
                  key="only"
                  ghost
                  loading={onlyButLoading}
                  onClick={async () => {
                    setOnlyButLoading(true);
                    let values = formRef.current.getFieldsValue();
                    values['steps'] = dataSource;
                    await formOk(values, false).then(
                      () => {
                        setSavedSource(deepCopyJsonArray(dataSource));
                        setOnlyButLoading(false);
                        return true;
                      },
                      () => {
                        setOnlyButLoading(false);
                        return false;
                      },
                    );
                  }}
                >
                  仅保存
                </Button>
              ) : null,
            ];
          },
        }}
        {...props}
        formItems={
          <>
            <DiyFormText
              rules={[
                { required: true, message: '用例名称必填' },
                { type: 'string' },
                { max: 50, message: '最多50个字' },
              ]}
              label="用例名称"
              placeholder="请输入用例名称"
            />
            <ProFormCascader
              name="module_related"
              width="lg"
              label="所属模块"
              allowClear={false}
              rules={[{ required: true, message: '所属模块必选！' }]}
              fieldProps={{
                changeOnSelect: true,
                expandTrigger: 'hover',
                options: treeCaseModuleData,
                fieldNames: { label: 'name', children: 'children', value: 'id' },
              }}
            />
            <Dropdown menu={{ items }} trigger={['click']} placement="bottomLeft">
              <Button type="primary" style={{ float: 'right', bottom: 56, marginRight: 20 }}>
                添加步骤
              </Button>
            </Dropdown>
            <DragSortTable
              scroll={{ y: 260 }}
              columns={stepColumns}
              tableState={tableState}
              stepFormState={stepFormState}
              controllerFormState={controllerFormState}
              treeCaseModuleData={treeCaseModuleData}
            />
          </>
        }
      />
      <StepForm stepFormState={stepFormState} tableState={tableState} />
      <ControllerForm stepFormState={controllerFormState} tableState={tableState} />
      {confirmOpen && (
        <ComfirmChangeForm
          formRef={formRef}
          open={confirmOpen}
          setOpen={setConfirmOpen}
          setCaseOpen={props.setOpen}
          formOk={formOk}
          dataSource={dataSource}
        />
      )}
    </>
  );
};

export const OverviewForm = ({ open, onCancel }: any) => {
  return (
    <Drawer
      width={1300}
      zIndex={102}
      bodyStyle={{ backgroundColor: '#F5F5F5' }}
      open={open}
      title={<span style={{ fontWeight: 'bold' }}>项目接口库（仅展示有接口的项目）</span>}
      footer={false}
      onClose={onCancel}
    >
      <ProjectOverview type={API} />
    </Drawer>
  );
};
