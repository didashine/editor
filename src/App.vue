<template>
    <div id="app" class="editor">
        <div class="tools">
            <div class="toolbar">
            </div>
            <div class="toolbar">
            </div>
            <div class="toolbar foreverToolbar">
        </div>
        </div>
        <div class="texts">
            <div class="text">
                <p>normal</p>
            </div>
            <div class="text">
                <p>normal</p>
            </div>
            <div class="text foreverText">
                <p>forever</p>
            </div>
        </div>
        <div class="drag"  draggable="false">
            <img src="../static/arrow.svg" alt="arrow">
            <ul>
                <li
                    v-for="(item, i) in lists"
                    :key="i"
                    draggable="true"
                    @dragstart="dragstart"
                    @dragend="dragend"
                >{{item}}</li>
            </ul>
        </div>
    </div>
</template>

<script>

import E from './components/wangEditor/js/index'
import './components/wangEditor/less/index.styl'

export default {
    name: 'App',
    data () {
        return {
        editorContent: '',
        editor: [],
        table:[],
        lists: []
        }
    },
    mounted() {
        this.mockData()
        this.initPage()
    },
    methods: {
        // 初始化编辑器
        initPage() {
        // 可能有多个编辑文档
        const toolbarList = document.getElementsByClassName('toolbar')
        const textList = document.getElementsByClassName('text')
        const toolTemplate = '<div class="toolbar"></div>'
        const textTemplate = '<div class="text"></div>'

        let i

        let fn = function(domList, pageIndex) {
            // 拿到包裹所有工具栏和编辑栏的容器
            let tools = document.getElementsByClassName('tools')[0]
            let texts = document.getElementsByClassName('texts')[0]
            let createElemByHTML = function (html) {
            html = html.replace('/\n/mg', '').trim()
            let div
            div = document.createElement('div')
            div.innerHTML = html
            return div.children[0]
            }

            let focus = function (el) {
            for ( let j=0; j < toolbarList.length; j++ ) {
                toolbarList[j].style.display = 'none'
            }
            el.$toolbarElem[0].style.display = 'flex'
            }

            //插入新的编辑器
            let newTool = tools.insertBefore(createElemByHTML(toolTemplate), toolbarList[pageIndex])
            let newText = texts.insertBefore(createElemByHTML(textTemplate), textList[pageIndex])

            // 插入被切出来的内容
            domList.forEach(el => {
            newText.appendChild(el)
            })

            let editor = new E(toolbarList[pageIndex], textList[pageIndex], fn)

            editor.customConfig.onfocus = () => focus(editor)
            editor.create()

            setTimeout(() => {
            focus(editor)
            window.scrollTo(0,textList[pageIndex].offsetTop+700);
            })
        }

        // toolbarList，textList length 必须相等
        for ( i=0; i < toolbarList.length; i++ ) {
            this.editor[i] =  new E(toolbarList[i], textList[i], fn);
        }

        this.editor.forEach((el, index) => {
            // 每个编辑框获得焦点时切换对应编辑框的工具栏
            el.customConfig.onfocus = () => {
            for ( i=0; i < toolbarList.length; i++ ) {
                toolbarList[i].style.display = 'none';
            }
            el.$toolbarElem[0].style.display = 'flex'
            }
            // 统一创建
            el.create();
        })

        // 将工具栏显示第一个编辑框的工具栏，并使第一个编辑框获得焦点
        toolbarList[0].style.display = 'flex';

        // 填充数据
        this.editor[toolbarList.length-1].fillData(this.table)
        },
        mockData() {
            for (let i = 0; i < 100; i++) {
                if  (i===0) {
                this.table.push({
                    0: '序号',
                    1: '检测项目',
                    2: '技术要求',
                    3: '检测结果',
                    4: '单项判定',
                    length: 5,
                })

                continue
                }
                this.table.push({
                0: i,
                1: '测试项目',
                2: '≤0.1',
                3: '未检出',
                4: '符合',
                length: 5,
                })
            }
            for (let i=0; i < 10; i++) {
                this.lists.push(`test${i}`)
            }
        },
        dragstart(ev) {
            ev.dataTransfer.setData("text", ev.target.innerHTML);
        },
        dragend(ev) {
        }
    }
}
</script>

<style lang="stylus">
body {
  margin: 0;
  padding: 0;
}
ul, li {
    margin: 0;
    padding: 0;
    border: 0;
    font-size: 100%;
    font-weight: normal;
    vertical-align: baseline;
    box-sizing: border-box;
}

li {
    list-style: none;
}
.editor {
  background: #eee;
  padding-bottom: 50px;
  padding-top: 100px;
}
.toolbar {
    border: 1px solid #ccc;
    display: none;
    background: #fff;
    margin-bottom: 50px;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 10001;
}
.text {
    outline: 1px solid #ccc;
    background: #fff;
    margin: auto;
    margin-bottom: 30px;
    width: 792px;
    height: 1083px;
    padding: 50px 57px;
}
.foreverText {
    height:auto;
    min-height: 1083px;
}

.drag {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    margin: auto;
    width:200px;
    height:300px;
    background: #fff;
    color: #999;
    border-bottom-right-radius 4px
    border-top-right-radius 4px
    img {
        width:20px;
        height:50px;
        position: absolute;
        right: -20px;
        top: 0;
        bottom: 0;
        margin: auto;
        background #fff
        border-bottom-right-radius 4px
        border-top-right-radius 4px
    }
    ul {
        height 100%
        overflow-y auto
    }
    li {
        text-align center
        padding 5px 0
        cursor default
        &:hover {
            background #D9E7F6
        }
    }
}
</style>
