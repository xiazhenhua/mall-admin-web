<template>
  <!--组件容器-->
  <div class="margin-top-20">
    <!-- 表格 -->
    <el-table
      v-loading="loading"
      ref="commonTable"
      :data="tableData"
      :element-loading-text="$t('common.loadingText')"
      highlight-current-row
      @sort-change="sortChange"
      @current-change="clickRow">
      <!-- 序号 -->
      <el-table-column
        :label="$t('common.index')"
        :index="indexMethod"
        :fixed="fixed"
        type="index"
        width="80"/>
      <!-- 循环输出列 -->
      <el-table-column
        v-for="(item , key) in tableCols"
        :fixed="item.fixed"
        :label="$t(item.label)"
        :prop="item.prop"
        :sortable="item.sortable"
        :key="key"
        :width="item.width === undefined ? 'auto' : item.width">
        <template slot-scope="scope">
          <span v-if="item.formData">
            {{ scope.row[item.prop] | dateformat('YYYY-MM-DD') }}
          </span>
          <span v-else-if="item.formYears">
            {{ scope.row[item.prop] | dateformat('YYYY-MM') }}
          </span>
          <span v-else-if="item.formMinutes">
            {{ scope.row[item.prop] | dateformat('YYYY-MM-DD HH:mm') }}
          </span>
          <span v-else-if="item.traverseCategory">
            {{ scope.row[item.prop] | getDictionaryName('DT_CATEGORY',scope.row[item.prop]) }}
          </span>
          <span v-else-if="item.traverseWorkType">
            {{ scope.row[item.prop] | getDictionaryName('DT_WORK_TYPE', scope.row[item.prop]) }}
          </span>
          <span v-else-if="item.traverseActionType">
            {{ scope.row[item.prop] | getDictionaryName('DT_ACTION',scope.row[item.prop]) }}
          </span>
          <span v-else-if="item.traverseFunctoion">
            {{ scope.row[item.prop] | getDictionaryName('DT_FUNCTOION',scope.row[item.prop]) }}
          </span>
          <span v-else-if="item.traverseTerminalType">
            {{ scope.row[item.prop] | getDictionaryName('DT_TERMINAL_TYPE',scope.row[item.prop]) }}
          </span>
          <span v-else-if="item.formDay && scope.row[item.prop] === 0 "/>
          <span v-else-if="item.formDay">
            {{ scope.row[item.prop] | dateformat('YYYY-MM-DD') }}
          </span>
          <span v-else>
            {{ scope.row[item.prop] }}
          </span>
        </template>
      </el-table-column>
      <!-- 操作按钮 -->
      <el-table-column
        v-if="hasEdit||hasDelete||hasLook"
        :label="$t('common.actions')"
        :fixed="fixed ? 'right' : false"
        :width="hasLook?'170px':'150px'">
        <template slot-scope="scope">
          <el-button
            v-if="hasEdit"
            type="text"
            @click="edit(scope.$index, scope.row)">{{ $t('common.edit') }}</el-button>
          <div v-if="hasEdit" class="buttonLine" />
          <el-button
            v-if="hasLook"
            type="text"
            @click="look(scope.$index, scope.row)">{{ $t('common.look') }}</el-button>
          <div v-if="hasLook && hasDelete" class="buttonLine" />
          <el-button
            v-if="hasDelete"
            size="mini"
            type="text"
            class="text-danger"
            @click="remove(scope.$index, scope.row)">{{ $t('common.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <div v-if="hasPagazation && total > 0" class="text-center margin-top-20 page-bottom-20">
      <el-pagination
        :page-sizes="[10, 20, 30, 50]"
        :total="total"
        :page-size="pSize"
        :current-page="pageNo"
        :pager-count="9"
        layout="prev, pager, next, sizes, jumper"
        background
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script>
export default {
  // 名称
  name: 'CustomTable',
  components: {},
  props: {
    // 是否需要固定列
    fixed: {
      type: Boolean,
      default: false
    },
    autoFetch: {
      type: Boolean,
      default: true
    },
    // 搜索条件
    searchData: {
      type: Object,
      default: () => {}
    },
    tableCols: {
      type: Array,
      default: () => []
    },
    // 搜索方法
    searchMethod: {
      type: String,
      default: ''
    },
    // 删除方法
    deleteMethod: {
      type: String,
      default: ''
    },
    // 编辑时重新读取数据的方法
    beforeEdittingMethod: {
      type: String,
      default: ''
    },
    // 主键
    rowId: {
      type: String,
      default: 'id'
    },
    pageSize: {
      type: Number,
      default: 10
    },
    // 是否有编辑操作
    hasEdit: {
      type: Boolean,
      default: true
    },
    // 是否有查看操作
    hasLook: {
      type: Boolean,
      default: false
    },
    // 是否包含删除按钮
    hasDelete: {
      type: Boolean,
      default: true
    },
    // 是否显示分页
    hasPagazation: {
      type: Boolean,
      default: true
    },
    // 搜索后回调函数
    onSearch: {
      type: Function,
      default: null
    },
    onBeforeDelete: {
      type: Function,
      default: null
    },
    // 删除回调函数
    onDelete: {
      type: Function,
      default: null
    },
    // 查看回调函数
    onLook: {
      type: Function,
      default: null
    },
    // 编辑回调函数
    onEdit: {
      type: Function,
      default: null
    },
    // 分页回调函数
    changePage: {
      type: Function,
      default: null
    },
    // 点击单行回调函数
    onClick: {
      type: Function,
      default: null
    }
  },
  // 引入组件
  data() {
    return {
      // 搜索结果数据
      tableData: [],
      // 是否显示加载信息
      loading: false,
      // 当前选中的数据行
      activeRowId: 0,
      total: 0,
      pSize: this.pageSize,
      pageNo: 1
    };
  },
  mounted() {
    if (this.autoFetch) {
      this.search();
    }
  },
  // 组件方法
  methods: {
    /**
     * 搜索
     */
    search() {
      const vm = this;
      if (this.searchMethod) {
        vm.loading = true;
        if (vm.hasPagazation) {
          vm.searchData.pageSize = vm.pSize;
          vm.searchData.pageNo = vm.pageNo;
        }

        // 执行搜索
        vm.$store
          .dispatch(vm.searchMethod, vm.searchData)
          .then(res => {
            if (res.totalPages < vm.pageNo) {
              vm.pageNo = res.totalPages
            }
            vm.tableData = res.items;
            if (vm.hasPagazation) {
              vm.total = res.totalCount;
            }
            // 设置首行为选中项
            if (vm.tableData !== null && vm.tableData.length > 0) {
              vm.$refs.commonTable.setCurrentRow(vm.tableData[0]);
              vm.$emit('hasData', true);
            } else {
              vm.$emit('hasData', false);
            }
            // 执行外部自定义搜索处理
            if (vm.onSearch) {
              const firstRow = vm.tableData.length > 0 ? vm.tableData[0] : {};
              vm.onSearch(firstRow);
            }
            vm.loading = false;
          })
          .catch(() => {
            vm.tableData = [];
            vm.loading = false;
          });
      }
    },
    /**
     * 编辑
     */
    edit(index, row) {
      const vm = this;
      if (vm.beforeEdittingMethod) {
        vm.$store
          .dispatch(vm.beforeEdittingMethod, row.id)
          .then(res => {
            vm.onEdit(res, row);
          })
          .catch(error => {
            if (error._attached.errorCode === 500) {
              vm.tipsMessage(error._attached.errorDescription, 'error');
            } else {
              vm.tipsMessage(error.Info.errorMessage, 'error');
            }
          });
      } else {
        vm.onEdit(index, row);
      }
    },
    // 查看
    look(index, row) {
      event.stopPropagation(); // 阻止点击事件冒泡
      this.onLook(index, row);
    },
    /**
     * 删除前进行处理，如果需要做一些条件过滤，可以使用onBeforeDelete，必须返回Boolean值
     */
    remove(index, row) {
      const vm = this;
      if (vm.deleteMethod) {
        if (vm.onBeforeDelete) {
          if (vm.onBeforeDelete(row)) {
            vm.onRemove(index, row);
          }
        } else {
          vm.onRemove(index, row);
        }
      }
    },
    /**
     * 执行删除
     */
    onRemove(index, row) {
      const vm = this;
      this.$confirm(vm.$t('common.deleteMessage'), {
        confirmButtonText: vm.$t('common.confirm'),
        cancelButtonText: vm.$t('common.cancel'),
        type: 'warning'
      }).then(() => {
        const deleteData = {};
        deleteData[vm.rowId] = row[vm.rowId];
        vm.$store
          .dispatch(vm.deleteMethod, deleteData)
          .then(res => {
            if (vm.onDelete) {
              vm.onDelete(index, row);
            }
            vm.tipsMessage(vm.$t('error.11'), 'success');
            // 最后一条的判断
            if ((vm.total - 1) % vm.pSize === 0) {
              vm.pageNo = vm.pageNo === 1 ? 1 : vm.pageNo - 1;
            }
            vm.search();
          })
          .catch(error => {
            if (error._attached.errorCode === 500) {
              vm.tipsMessage(error._attached.errorDescription, 'error');
            } else {
              vm.tipsMessage(error.Info.errorMessage, 'error');
            }
          });
      }).catch(() => {});
    },
    /**
     * 改变当前选中行
    */
    clickRow(row) {
      if (row) {
        const vm = this;
        vm.activeRowId = row[vm.rowId];
        if (this.onClick) {
          this.onClick(row);
        }
      }
    },
    /**
     * 改变每页显示条数
     */
    handleSizeChange(val) {
      this.pSize = val;
      this.pageNo = 1;
      if (this.changePage) {
        this.changePage(val);
      }
      this.search();
    },
    /**
     * 改变当前页数
     */
    handleCurrentChange(val) {
      this.pageNo = val;
      if (this.changePage) {
        this.changePage(val);
      }
      this.search();
    },
    /**
     * 自定义序号
     */
    indexMethod(index) {
      return this.pSize * (this.pageNo - 1) + index + 1;
    },
    // 按照字段排序
    sortChange: function(column, prop, order) {
      // 正序：ascending  倒序：descending
      this.searchData.ascending = (column.order === 'ascending');
      this.searchData.orderBy = column.prop
      this.search();
    },
    tipsMessage(txt, type) {
      // 消息提示
      this.$message({
        message: txt,
        type: type,
        showClose: true,
        duration: 3 * 1000
      });
    }
  }
};
</script>
