<script setup lang="ts">
import {
  ArrowDown
} from '@element-plus/icons-vue'
</script>

<template>
  <div class="outer-div">
        <el-container>
            <el-header class="header">
                <nav>
                    <RouterLink to="/">Index</RouterLink>&nbsp;
                    <RouterLink to="/bulk">Bulk</RouterLink>&nbsp;
                    <el-dropdown>
                      <span class="el-dropdown-link dropdown-toolbox">
                        Toolbox<el-icon class="el-icon--right"><arrow-down /></el-icon>
                      </span>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item>
                            <RouterLink to="/append-orig-param">Append Orig Parameter</RouterLink>
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                </nav>
            </el-header>
            <el-main class="main">
                    <RouterView />
            </el-main>
        </el-container>
  </div>
</template>

<style lang="css" scoped>
.header {
  height: 10px;
  padding: 0 0 0 0;
}

.main {
  padding: 0 0 0 0;
}

.dropdown-toolbox {
  font-size: 16px;
}
</style>