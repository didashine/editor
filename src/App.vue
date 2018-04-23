<template>
  <div id="app">
    <div id="div1" class="toolbar" ref="div1">
    </div>
    <div style="padding: 10px 0; color: #ccc">中间隔离带</div>
    <div id="div2" class="text" ref="div2">
        <p>请输入内容</p>
    </div>
  </div>
</template>

<script>

import E from './components/wangEditor/js/index'

export default {
  name: 'App',
  data () {
    return {
      editorContent: ''
    }
  },
  methods: {
    aaa() {
      let json = this.editor.txt.getJSON()
      let jsonStr = JSON.stringify(json)
      console.log(json)
      console.log(jsonStr)
      alert(jsonStr)
    }
  },
  mounted() {
    this.editor = new E(this.$refs.div1, this.$refs.div2);
    this.editor.create();
    console.log(this.editor);
  }
}
</script>

<style>

.toolbar {
    border: 1px solid #ccc;
}
.text {
    border: 1px solid #ccc;
    min-height: 300px;
}
</style>
