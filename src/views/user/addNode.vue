<!-- 标准工作流管理 -->
<template>
  <!--组件容器-->
  <div id="addNode">
    <el-dialog
      :visible.sync="dialogVisible"
      :title="title"
      width="750px"
      center
      @close="close">
      <el-row :gutter="10">
        <el-form ref="nodeForm" :model="nodeForm" :rules="nodeRules" label-width="120px">
          <el-col :span="24">
            <el-col :span="12">
              <!-- 步骤序号 -->
              <el-form-item :label="$t('workFlow.stepNum')" prop="order">
                <el-input v-model.trim="nodeForm.order" maxlength="2" auto-complete="off" size="small" @keyup.native="proving"/>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <!-- 复选框 -->
              <el-form-item style="margin-left: -80px;">
                <el-checkbox v-model="nodeForm.isSystemAutoExec" :disabled="checkDisabled">{{ $t('workFlow.autoImplement') }}</el-checkbox>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <!-- 复选框 -->
              <el-form-item style="margin-left: -80px;">
                <el-checkbox v-model="nodeForm.isImmediatelyExecute">{{ $t('workFlow.immediate') }}</el-checkbox>
              </el-form-item>
            </el-col>
          </el-col>
          <el-col :span="24">
            <el-col :span="12">
              <!-- 节点编码 -->
              <el-form-item :label="$t('workFlow.nodeCode')" prop="code">
                <el-input v-model.trim="nodeForm.code" :disabled="isEdit" maxlength="30" auto-complete="off" size="small"/>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <!-- 节点名称 -->
              <el-form-item :label="$t('workFlow.nodeName')" prop="name">
                <el-input v-model.trim="nodeForm.name" maxlength="20" auto-complete="off" size="small"/>
              </el-form-item>
            </el-col>
          </el-col>
          <el-col :span="24">
            <el-col :span="12">
              <!-- 工作类型 -->
              <el-form-item :label="$t('workFlow.workType')" prop="type">
                <el-select :disabled="flag === 1" v-model="nodeForm.type" size="small" @change="typeChange">
                  <el-option
                    v-for="(item, key) in workTypeList"
                    :key="key"
                    :label="item.name"
                    :value="item.value"/>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item ref="formKey" :class="{'is-required':!nodeForm.isSystemAutoExec}" :label="$t('workFlow.callPage')" prop="formKey">
                <el-select v-model="nodeForm.formKey" size="small">
                  <el-option
                    v-for="(item, key) in pageList.options"
                    :key="key"
                    :label="item.name"
                    :value="key"/>
                </el-select>
              </el-form-item>
            </el-col>
          </el-col>
          <el-col :span="12">
            <el-col :span="24">
              <!-- 操作完成状态 -->
              <el-form-item :label="$t('workFlow.operationCompletedState')" prop="operateSuccessStatus">
                <el-select v-model="nodeForm.operateSuccessStatus" :placeholder="holderSuccess" size="small">
                  <el-option
                    v-for="(value, key) in completedStateList.options"
                    :key="key"
                    :label="value.name"
                    :value="key"/>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item v-if="nodeForm.type === 1" prop="operateFailureStatus">
                <el-select v-model="nodeForm.operateFailureStatus" :placeholder="holderFail" size="small">
                  <el-option
                    v-for="(item, key) in completedStateList.options"
                    :key="key"
                    :label="item.name"
                    :value="key"/>
                </el-select>
              </el-form-item>
            </el-col>
          </el-col>
          <el-col :span="12" class="rightFormItem">
            <el-col :span="24">
              <!-- 操作方式 -->
              <el-form-item :label="$t('workFlow.operationMode')" prop="method">
                <el-select v-model="nodeForm.method" size="small" @change="methodChange">
                  <el-option
                    v-for="(item, key) in operationModeList"
                    :key="key"
                    :label="item.name"
                    :value="item.id"/>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <!-- 或签人数 -->
              <el-form-item v-if="nodeForm.method === 1 && nodeForm.type !== 1" :label="$t('workFlow.numOfPeople')" prop="numberOfSigned">
                <el-input v-model.trim="nodeForm.numberOfSigned" onkeypress="return event.keyCode>=48&&event.keyCode<=57" maxlength="30" auto-complete="off" size="small"/>
              </el-form-item>
            </el-col>
          </el-col>
        </el-form>
      </el-row>
      <span slot="footer" class="dialog-footer">
        <el-button @click="close">{{ $t('workFlow.cancel') }}</el-button>
        <el-button v-loading.fullscreen.lock="fullscreenLoading" type="primary" @click="save">{{ $t('workFlow.save') }}</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { Message } from 'element-ui';
import { getDictByType } from '@/utils/common';
export default {
  // 名称
  name: 'AddNode',
  props: {
    isVisible: {
    // 控制是否显示
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      default: ''
    },
    workFlowId: {
      type: Number,
      default: null
    },
    // 标题
    title: {
      type: String,
      default: ''
    }
  },
  data() {
    // 或签人数验证
    const checkNumOfPeople = (rule, value, callback) => {
      if (value === '' || value === '0') {
        callback(new Error(this.$t('workFlow.numOfPeopleError')));
      } else {
        callback();
      }
    };
    const codePass = (rule, value, callback) => {
      // 验证节点编码
      if (value === '') {
        callback(new Error(this.$t('workFlow.nodeCodeError')));
      } else if (/[0-9]/.test(value.charAt(0))) {
        callback(new Error(this.$t('workFlow.codeError')));
      } else {
        callback();
      }
    };
    // 调用页面的验证
    const formKey = (rule, value, callback) => {
      if (this.nodeForm.isSystemAutoExec || value) {
        callback();
      } else {
        callback(new Error(this.$t('workFlow.formKeyError')));
      }
    };
    return {
      flag: 0,
      fullscreenLoading: false,
      nodeId: '',
      businessType: '',
      checkDisabled: false,
      isEdit: false,
      workTypeList: [
        { name: '操作', value: 0 },
        { name: '审批', value: 1 }
      ],
      pageList: {
        options: {}
      },
      completedStateList: {
        options: {}
      },
      dialogVisible: false,
      holderSuccess: this.$t('common.defaultPlaceHolder'),
      holderFail: this.$t('common.defaultPlaceHolder'),
      nodeForm: {
        order: '', // 步骤序号
        isSystemAutoExec: false, // 系统自动执行
        isImmediatelyExecute: true, // 即时业务流转
        code: '', // 节点编码
        name: '', // 节点名称
        type: null, // 工作类型
        operateFailureStatus: '', // 审批驳回状态
        operateSuccessStatus: '', // 操作成功状态
        method: '', // 操作方式
        formKey: '', // 调用页面
        numberOfSigned: 1
      },
      operationModeList: [
        { name: '会签',
          id: 0
        },
        { name: '或签',
          id: 1
        }
      ],
      nodeRules: {
        // 验证规则
        order: [
          { required: true,
            message: this.$t('workFlow.nodeNumError'),
            trigger: 'blur'
          }
        ],
        code: [
          { required: true,
            trigger: 'blur',
            validator: codePass
          }
        ],
        formKey: [
          {
            trigger: 'change',
            validator: formKey
          }
        ],
        name: [
          { required: true,
            message: this.$t('workFlow.nodeNameError'),
            trigger: 'blur'
          }
        ],
        type: [
          { required: true,
            message: this.$t('workFlow.workTypeError'),
            trigger: 'change'
          }
        ],
        numberOfSigned: [
          { required: true,
            trigger: 'blur',
            validator: checkNumOfPeople
          }
        ],
        method: [
          { required: true,
            message: this.$t('workFlow.operationModeError'),
            trigger: 'change'
          }
        ],
        operateSuccessStatus: [
          { required: true,
            message: this.$t('workFlow.completedStateError'),
            trigger: 'change'
          }
        ],
        operateFailureStatus: [
          { required: true,
            message: this.$t('workFlow.completedStateError'),
            trigger: 'change'
          }
        ]
      }
    }
  },
  computed: {
    // 预处理的相关方法
  },
  watch: {
    // 监听popup是否弹出
    isVisible: function(newVal) {
      this.dialogVisible = newVal;
    },
    type: function(newVal) {
      const vm = this;
      vm.businessType = newVal;
      vm.pageList = {
        option: {}
      }
      vm.completedStateList = {
        option: {}
      }
      if (newVal !== '') {
        vm.searchDictionary();
      }
    },
    // 监听系统自动执行，触发调用页面验证
    'nodeForm.isSystemAutoExec': function(newVal) {
      this.$refs['nodeForm'].validateField('formKey');
    }
  },
  mounted() {},
  // 组件方法
  methods: {
    openEdit(nodeId) {
      const vm = this;
      vm.isEdit = true;
      vm.nodeId = nodeId;
      vm.search();
    },
    search() {
      // 编辑时搜索工作流节点详细信息
      const vm = this;
      const searchData = {
        nodeId: vm.nodeId,
        workFlowId: vm.workFlowId
      }
      vm.flag = 1;
      vm.$store.dispatch('getWorkFlowNodeDetail', searchData).then((res) => {
        vm.nodeForm = res;
      }).catch(error => {
        Message({
          message: error.Info.errorMessage,
          type: 'error',
          showClose: true,
          duration: 3 * 1000
        });
      })
    },
    searchDictionary() {
      // 调取字典
      const vm = this;
      const pageDictionaryKey = vm.businessType + '_FORM';
      const statusDictionaryKey = vm.businessType + '_STATUS';
      vm.pageList = getDictByType(pageDictionaryKey);
      vm.completedStateList = getDictByType(statusDictionaryKey);
    },
    typeChange(val) {
      // 改变工作类型时验证并禁用系统自动执行checkbox
      const vm = this;
      if (val === 1) {
        vm.checkDisabled = true;
        vm.nodeForm.numberOfSigned = 1;
        vm.nodeForm.isSystemAutoExec = false;
        // 工作类型“审批”时改变placeholder
        vm.holderSuccess = vm.$t('workFlow.approvalSuccessError');
        vm.holderFail = vm.$t('workFlow.approvalFailError');
      } else if (val === 0) {
        vm.checkDisabled = false;
        vm.holderSuccess = vm.$t('common.defaultPlaceHolder');
        vm.holderFail = vm.$t('common.defaultPlaceHolder');
      }
    },
    methodChange(val) {
      // 操作方式改变时设置或签人数
      if (val === 0) {
        this.nodeForm.numOfSigned = 1;
      }
    },
    proving() {
      // 只可输入数字
      this.nodeForm.order = this.nodeForm.order.replace(/[^\d]/g, '');
      this.nodeForm.order = this.nodeForm.order.replace(/^(\-)*(\d+)\.(\d{0,2}).*$/, '$1$2.$3');
    },
    save() {
      const vm = this;
      vm.$refs.nodeForm.validate((valid) => {
        if (valid) {
          // 保存表单
          if (vm.isEdit === false) {
            vm.create();
          } else {
            vm.edit();
          }
        } else {
          // 校验失败
          return false;
        }
      });
    },
    create() {
      // 创建工作流节点
      const vm = this;
      vm.fullscreenLoading = true;
      vm.nodeForm.workFlowId = vm.workFlowId
      const form = vm.nodeForm;
      vm.$store.dispatch('createWorkFlowNode', form).then((res) => {
        vm.fullscreenLoading = false;
        vm.close();
        Message({
          // 新增工作流成功
          message: vm.$t('workFlow.success'),
          type: 'success',
          showClose: true,
          duration: 3 * 1000
        })
        vm.$emit('updata');
      }).catch(error => {
        vm.fullscreenLoading = false;
        Message({
          message: error.Info.errorMessage,
          type: 'error',
          showClose: true,
          duration: 3 * 1000
        });
      })
    },
    close() {
      // 关闭工作流节点恢复默认值
      const vm = this;
      vm.isEdit = false;
      vm.$refs.nodeForm.resetFields();
      vm.nodeForm.isSystemAutoExec = false;
      vm.flag = 0;
      vm.checkDisabled = false;
      vm.nodeForm.isImmediatelyExecute = true;
      vm.nodeForm.operateFailureStatus = '';
      vm.nodeForm.numberOfSigned = 1;
      vm.holderSuccess = vm.$t('common.defaultPlaceHolder');
      vm.holderFail = vm.$t('common.defaultPlaceHolder');
      vm.$emit('update:isVisible', false);
    },
    edit() {
      // 编辑工作流节点
      const vm = this;
      vm.fullscreenLoading = true;
      vm.nodeForm.workFlowId = vm.workFlowId
      const form = vm.nodeForm;
      vm.$store.dispatch('editWorkFlowNode', form).then((res) => {
        vm.fullscreenLoading = false;
        vm.close();
        Message({
          // 编辑工作流成功
          message: vm.$t('workFlow.success'),
          type: 'success',
          showClose: true,
          duration: 3 * 1000
        })
        vm.$emit('updata');
      }).catch(error => {
        vm.fullscreenLoading = false;
        Message({
          message: error.Info.errorMessage,
          type: 'error',
          showClose: true,
          duration: 3 * 1000
        });
      })
    }
  }
}
</script>
<style rel="stylesheet/scss" lang="scss" scoped>
  /* 当前组件相关的式样 */
</style>
<style>
  #addNode .el-input{
    width: 200px;
  }
  .rightFormItem {
    padding-left: 0!important;
  }
</style>

