<script setup lang="ts">

</script>

<template>
  <div class="outer-div">
        <el-container>
            <el-header class="header">
                <nav>
                    <RouterLink to="/">Index</RouterLink>&nbsp;
                    <RouterLink to="/bulk">Bulk</RouterLink>
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
</style>