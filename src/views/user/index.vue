<template> 
  <div class="app-container">
    <el-card class="filter-container" shadow="never">
        <div>
          <i class="el-icon-search"></i>
          <span>筛选搜索</span>
          <el-button
            style="float: right"
            @click="searchMemberList()"
            type="primary"
            size="small">
            查询  
          </el-button>
        </div>
        <div style="margin-top: 15px">
          <el-form :inline="true" :model="listQuery" size="small" label-width="140px">
            <el-form-item label="输入搜索：">
              <el-input style="width: 203px" v-model="listQuery.keyword" placeholder="会员名称/关键字"></el-input>
            </el-form-item>
          </el-form>
        </div>
    </el-card>
    <el-card class="operate-container" shadow="never">
      <i class="el-icon-tickets"></i>
      <span>数据列表</span>
      <el-button
        class="btn-add"
        @click="createMember()"
        size="mini">
        添加
      </el-button>
    </el-card>
    <div class="table-container">
      <el-table ref="brandTable"
                :data="list"
                style="width: 100%"
                @selection-change="handleSelectionChange"
                v-loading="listLoading"
                border>
        <el-table-column type="selection" width="60" align="center"></el-table-column>
        <el-table-column label="编号" width="100" align="center">
          <template slot-scope="scope">{{scope.row.id}}</template>
        </el-table-column>
        <el-table-column label="姓名" align="center">
          <template slot-scope="scope">{{scope.row.username}}</template>
        </el-table-column>
        <el-table-column label="手机号" align="center">
          <template slot-scope="scope">{{scope.row.phone}}</template>
        </el-table-column>
        <el-table-column label="性别" align="center">
          <template slot-scope="scope">{{scope.row.gender}}</template>
        </el-table-column>
        <el-table-column label="启用\禁用" width="100" align="center">
          <template slot-scope="scope">
            <el-switch
              @change="handleShowStatusChange(scope.$index, scope.row)"
              :active-value="1"
              :inactive-value="0"
              v-model="scope.row.status">
            </el-switch>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center">
          <template slot-scope="scope">
            <el-button
              size="mini"
              @click="handleUpdate(scope.$index, scope.row)">编辑
            </el-button>
            <el-button
              size="mini"
              type="danger"
              @click="handleDelete(scope.$index, scope.row)">删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="pagination-container">
      <el-pagination
        background
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        layout="total, sizes,prev, pager, next,jumper"
        :page-size="listQuery.pageSize"
        :page-sizes="[5,10,15]"
        :current-page.sync="listQuery.pageNum"
        :total="total">
      </el-pagination>
    </div>
    <!-- 新建、编辑会员弹窗 -->
    <el-dialog :visible.sync="dialogVisible" :title="dialogTitle" :before-close="closeDialog" center>
      <el-form ref="memberForm" :model="memberForm" :rules="memberRules" label-position="left" label-width="100px">
        <!-- 用户名 -->
        <el-form-item label="用户名" prop="username">
          <el-input v-model="memberForm.username" laceholder="请输入用户名" size="small" auto-complete="off" maxlength="20"/>
        </el-form-item>
        <!-- 昵称 -->
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="memberForm.nickname" placeholder="请输入昵称" size="small" auto-complete="off" maxlength="20"/>
        </el-form-item>
        <!-- 手机号 -->
        <el-form-item label="手机号" prop="phone">
          <el-input v-model.number="memberForm.phone" onkeypress="return event.keyCode>=48&&event.keyCode<=57" placeholder="请输入手机号" size="small" auto-complete="off" minlength="11" maxlength="11"/>
        </el-form-item>
        <!-- 帐号启用状态 -->
        <el-form-item label="帐号启用状态" prop="status">
          <el-radio-group v-model="memberForm.status">
            <el-radio :label="1">是</el-radio>
            <el-radio :label="0">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <!-- 性别 -->
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="memberForm.gender">
            <el-radio :label="1">男</el-radio>
            <el-radio :label="0">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <!-- 生日 -->
        <el-form-item label="生日" prop="gender">
          <el-date-picker
            v-model="memberForm.birthday"
            type="date"
            placeholder="选择日期">
          </el-date-picker>
        </el-form-item>
        <!-- 所住城市 -->
        <el-form-item label="所住城市" prop="city">
          <el-input v-model="memberForm.city" placeholder="请输入所住城市" size="small" auto-complete="off" maxlength="20"/>
        </el-form-item>
        <!-- 职业 -->
        <el-form-item label="职业" prop="job">
          <el-input v-model="memberForm.job" placeholder="请输入职业" size="small" auto-complete="off" maxlength="20"/>
        </el-form-item>
      </el-form>
      <!-- 提交工艺系统表单 -->
      <div slot="footer">
        <!-- 取消按钮 -->
        <el-button @click="closeDialog">取消</el-button>
        <!-- 保存按钮 -->
        <el-button type="primary" @click="submitForm('memberForm')">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script>
  import {fetchList,updateStatus,updateMember,fetchPartList,deleteMember} from '@/api/member'

  export default {
    name: 'brandList',
    data() {
      return {
        operates: [
          {
            label: "显示品牌",
            value: "showBrand"
          },
          {
            label: "隐藏品牌",
            value: "hideBrand"
          }
        ],
        operateType: null,
        listQuery: {
          keyword: null,
          pageNum: 1,
          pageSize: 10
        },
        list: null,
        total: null,
        listLoading: true,
        multipleSelection: [],
        // 弹窗参数
        // 标题
        dialogTitle: '',
        // 弹窗 显示和隐藏的标识
        dialogVisible: false,
        memberForm: {
          username:'',
          nickname:'',
          phone:'',
          status:1,
          gender:0,
          birthday:new Date(),
          city:'',
          job:''
        },
        // 新建和编辑的标识
        isCreate: false,
        memberRules: {
          username: [
            { required: true, message: '请输入用户名', trigger: 'blur' },
            { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'change' }
          ],
          nickname: [
            { required: true, message: '请输入昵称', trigger: 'change' }
          ],
          phone: [
            { required: true, message: '请输入手机号', trigger: 'change' }
          ],
          status: [
            { required: true, message: '请选择启用状态', trigger: 'change' }
          ],
          gender: [
            { required: true, message: '请选择性别', trigger: 'change' }
          ],
          birthday: [
            { type: 'date', required: true, message: '请选择时间', trigger: 'change' }
          ],
          city: [
            { required: true, message: '请填写所住城市', trigger: 'change' }
          ],
          job: [
            { required: true, message: '请填写职业', trigger: 'change' }
          ]
        }
      }
    },
    created() {
      this.getList();
    },
    methods: {
      getList() {
        this.listLoading = true;
        fetchList(this.listQuery).then(response => {
           this.listLoading = false;
          this.list = response.data.list;
          this.total = response.data.total;
          this.totalPage = response.data.totalPage;
          this.pageSize = response.data.pageSize;
        });
      },
      getPartList() {
        this.listLoading = true;
        fetchList(this.listQuery).then(response => {
           this.listLoading = false;
          this.list = response.data.list;
          this.total = response.data.total;
          this.totalPage = response.data.totalPage;
          this.pageSize = response.data.pageSize;
        });
      },

      handleSelectionChange(val) {
        this.multipleSelection = val;
      },
      handleUpdate(index, row) {
        const vm = this;
        vm.isCreate = false;
        vm.dialogTitle = "编辑员工"
        vm.memberForm = Object.assign({},row)
        vm.dialogVisible = true;
      },
      // 取消弹窗
      closeDialog(){
        const vm = this;
        vm.$refs.memberForm.resetFields();
        vm.dialogVisible = false;
        vm.getList();
      },
      // 保存、
      submitForm() {
        // 新建/编辑
        const vm = this;
        vm.$refs.memberForm.validate(valid => {
          if (valid) {
            const data = vm.memberForm
            const flag = vm.isCreate;
            // 判断新建还是编辑
            updateMember(flag,data).then(response => {
              if(response.code==200){
                vm.$message({
                  message: flag?'新建员工成功':'编辑员工成功',
                  type: 'success',
                  showClose: true,
                  duration: 3 * 1000
                });
                vm.closeDialog();
              }
            }).catch(()=>{
              vm.$message({
                message: flag?'新建员工失败':'编辑员工失败',
                type: 'error',
                showClose: true,
                duration: 3 * 1000
              });
            });
          } else {
            return false;
          }
        });
      },
      handleDelete(index, row) {
        this.$confirm('是否要删除该会员', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          deleteMember(row.id).then(response => {
            this.$message({
              message: '删除成功',
              type: 'success',
              duration: 1000
            });
            this.getList();
          });
        });
      },
    
    
      handleShowStatusChange(index, row) {
        let data = new URLSearchParams();
        ;
        data.append("id", row.id);
        data.append("status", row.status);
        updateStatus(data).then(response => {
          this.$message({
            message: '修改成功',
            type: 'success',
            duration: 1000
          });
        }).catch(error => {
          if (row.status === 0) {
            row.status = 1;
          } else {
            row.status = 0;
          }
        });
      },
      handleSizeChange(val) {
        this.listQuery.pageNum = 1;
        this.listQuery.pageSize = val;
        this.getList();
      },
      handleCurrentChange(val) {
        this.listQuery.pageNum = val;
        this.getList();
      },
      searchMemberList() {
        this.listQuery.pageNum = 1;
        this.getPartList();
      },
      createMember() {
        const vm = this;
        vm.isCreate = true;
        vm.dialogTitle = "新建员工"
        vm.memberForm={
          username:'',
          nickname:'',
          phone:'',
          status:1,
          gender:0,
          birthday:new Date(),
          city:'',
          job:''
        }
        vm.dialogVisible = true;
      }
    }
  }
</script>
<style rel="stylesheet/scss" lang="scss" scoped>


</style>


