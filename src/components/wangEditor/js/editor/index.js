/*
    编辑器构造函数
*/

import $ from '../util/dom-core.js'
import _config from '../config.js'
import Menus from '../menus/index.js'
import Text from '../text/index.js'
import Command from '../command/index.js'
import selectionAPI from '../selection/index.js'
import UploadImg from './upload/upload-img.js'
import { arrForEach, objForEach } from '../util/util.js'
import { getRandom } from '../util/util.js'

// id，累加
let editorId = 1

// 构造函数
//* callback为点击分页小✂️回调 参数为被切行上面的所有元素数组
function Editor(toolbarSelector, textSelector, callback) {
    if (toolbarSelector == null) {
        // 没有传入任何参数，报错
        throw new Error('错误：初始化编辑器时候未传入任何参数，请查阅文档')
    }
    // id，用以区分单个页面不同的编辑器对象
    this.id = 'wangEditor-' + editorId++
    this.toolbarSelector = toolbarSelector
    this.textSelector = textSelector
    this.callback = callback
    // 自定义配置
    this.customConfig = {}

    //* table id属性列表，用于绑定事件
    this.tableIdList = []
     //* 分页线数量
    this.lineNum = 0
    //* 当前🖱悬停块区域的节点位置
    this.currentIndex

    // 从50高度开始累加983
    this.lineHeight = 50
    this.operateH = 983
}

// 修改原型
Editor.prototype = {
    constructor: Editor,

    // 初始化配置
    _initConfig: function () {
        // _config 是默认配置，this.customConfig 是用户自定义配置，将它们 merge 之后再赋值
        let target = {}
        this.config = Object.assign(target, _config, this.customConfig)

        // 将语言配置，生成正则表达式 {}
        const langConfig = this.config.lang || {}
        const langArgs = []
        objForEach(langConfig, (key, val) => {
            // key 即需要生成正则表达式的规则，如“插入链接”
            // val 即需要被替换成的语言，如“insert link”
            langArgs.push({
                reg: new RegExp(key, 'img'),
                val: val

            })
        })
        this.config.langArgs = langArgs
    },

    // 初始化 DOM
    _initDom: function () {
        const toolbarSelector = this.toolbarSelector
        const $toolbarSelector = $(toolbarSelector)
        const textSelector = this.textSelector

        const config = this.config
        const zIndex = config.zIndex

        // 定义变量
        let $toolbarElem, $textContainerElem, $textElem, $children

        if (textSelector == null) {
            // 只传入一个参数，即是容器的选择器或元素，toolbar 和 text 的元素自行创建
            $toolbarElem = $('<div></div>')
            $textContainerElem = $('<div></div>')

            // 将编辑器区域原有的内容，暂存起来
            $children = $toolbarSelector.children()

            // 添加到 DOM 结构中
            $toolbarSelector.append($toolbarElem).append($textContainerElem)

            // 自行创建的，需要配置默认的样式
            $toolbarElem.css('background-color', '#f1f1f1')
                            .css('border', '1px solid #ccc')
            $textContainerElem.css('border', '1px solid #ccc')
                            .css('border-top', 'none')
                            .css('height', '300px')
        } else {
            // toolbar 和 text 的选择器都有值，记录属性
            $toolbarElem = $toolbarSelector
            $textContainerElem = $(textSelector)
            // 将编辑器区域原有的内容，暂存起来
            $children = $textContainerElem.children()
        }

        // 编辑区域
        $textElem = $('<div></div>')
        $textElem.attr('contenteditable', 'true')
                .css('width', '100%')
                .css('height', '100%')

        //* 拿到编辑区域原有内容中的表格,记录id属性,用于后面绑定table事件
        for (let i=0; i < $children.length; i++) {
            if ($children[i].tagName === 'TABLE') {
                this.tableIdList.push($children[i].id);
            }
        }

        //* 编辑表格和非表格的自定义🖱右键菜单
        const tContextmenuId = getRandom('tContextmenu')
        const scissorId = getRandom('scissorId')
        $textContainerElem.append($(`
            <div class="w-scissor">
                <img src="/static/scissor.svg" id="${scissorId}">
                </img>
            </div>
        `))
        $textContainerElem.append($(`
            <ul class="w-contextmenu" id="${tContextmenuId}">
                <li data-type="merge"><a>合并单元格</a></li>
                <li data-type="cut"><a>分割页面</a></li>
            </ul>
        `))

        // 初始化编辑区域内容
        if ($children && $children.length) {
            $textElem.append($children)
        } else {
            $textElem.append($('<p><br></p>'))
        }
        // 编辑区域加入DOM
        $textContainerElem.append($textElem)

        // 设置通用的 class
        $toolbarElem.addClass('w-e-toolbar')
        $textContainerElem.addClass('w-e-text-container')
        $textContainerElem.css('z-index', zIndex)
        $textElem.addClass('w-e-text')

        // 添加 ID
        const toolbarElemId = getRandom('toolbar-elem')
        $toolbarElem.attr('id', toolbarElemId)
        const textElemId = getRandom('text-elem')
        $textElem.attr('id', textElemId)

        // 记录属性
        this.$toolbarElem = $toolbarElem
        this.$textContainerElem = $textContainerElem
        this.$textElem = $textElem
        this.toolbarElemId = toolbarElemId
        this.textElemId = textElemId
        this.tContextmenuId = tContextmenuId
        this.scissorId = scissorId
        // 记录输入法的开始和结束
        let compositionEnd = true
        $textContainerElem.on('compositionstart', () => {
            // 输入法开始输入
            compositionEnd = false
        })
        $textContainerElem.on('compositionend', () => {
            // 输入法结束输入
            compositionEnd = true
        })

        // 绑定 onchange 对外使用
        $textContainerElem.on('click keyup', () => {
            // 输入法结束才出发 onchange
            compositionEnd && this.change &&  this.change()
        })
        $toolbarElem.on('click', function () {
            this.change &&  this.change()
        })

        //绑定 onfocus 与 onblur 事件 对外使用
        if(config.onfocus || config.onblur){
            // 当前编辑器是否是焦点状态
            this.isFocus = false

            $(document).on('click', (e) => {
                //判断当前点击元素是否在编辑器内
                const isChild = $textElem.isContain($(e.target))

                //判断当前点击元素是否为工具栏
                const isToolbar = $toolbarElem.isContain($(e.target))
                const isMenu = $toolbarElem[0] == e.target ? true : false

                if (!isChild) {
                    //若为选择工具栏中的功能，则不视为成blur操作
                    if(isToolbar && !isMenu){
                        return
                    }

                    if(this.isFocus){
                        this.onblur && this.onblur()
                    }
                    this.isFocus = false
                }else{
                    if(!this.isFocus){
                        this.onfocus && this.onfocus()
                    }
                    this.isFocus = true
                }
            })
        }

    },

    // 封装 command
    _initCommand: function () {
        this.cmd = new Command(this)
    },

    // 封装 selection range API
    _initSelectionAPI: function () {
        this.selection = new selectionAPI(this)
    },

    // 添加图片上传
    _initUploadImg: function () {
        this.uploadImg = new UploadImg(this)
    },

    // 初始化菜单
    _initMenus: function () {
        this.menus = new Menus(this)
        this.menus.init()
    },

    // 添加 text 区域
    _initText: function () {
        this.txt = new Text(this)
        this.txt.init()
    },

    // 初始化选区，将光标定位到内容尾部
    initSelection: function (newLine) {
        const $textElem = this.$textElem
        const $children = $textElem.children()
        if (!$children.length) {
            // 如果编辑器区域无内容，添加一个空行，重新设置选区
            $textElem.append($('<p><br></p>'))
            this.initSelection()
            return
        }

        const $last = $children.last()

        if (newLine) {
            // 新增一个空行
            const html = $last.html().toLowerCase()
            const nodeName = $last.getNodeName()
            if ((html !== '<br>' && html !== '<br\/>') || nodeName !== 'P') {
                // 最后一个元素不是 <p><br></p>，添加一个空行，重新设置选区
                $textElem.append($('<p><br></p>'))
                this.initSelection()
                return
            }
        }

        this.selection.createRangeByElem($last, false, true)
        this.selection.restoreSelection()
    },

    // 绑定事件
    _bindEvent: function () {
        // -------- 绑定 onchange 事件 --------
        let onChangeTimeoutId = 0
        let beforeChangeHtml = this.txt.html()
        const config = this.config

        // onchange 触发延迟时间
        let onchangeTimeout = config.onchangeTimeout
        onchangeTimeout = parseInt(onchangeTimeout, 10)
        if (!onchangeTimeout || onchangeTimeout <= 0) {
            onchangeTimeout = 200
        }

        const onchange = config.onchange

        //* 设置分页线
        const setPagingLine = () => {
            let el = this.$textElem[0]
            // 去除padding 操作区域高度983px
            let num = el.clientHeight % this.operateH === 0 ? parseInt(el.clientHeight/this.operateH) - 1 : parseInt(el.clientHeight/this.operateH)

            // 先把之前插入的分页线remove
            let lines = document.getElementsByClassName('pagingLine')
            // 不能直接在for判断中用lines.length 会变化
            const len = lines.length
            for (let i=0; i < len; i++) {
              this.$textContainerElem[0].removeChild(lines[0])
            }

            // 重置初始高度 初始50为顶部padding
            this.lineHeight = 50
            for ( let j = 0; j < num; j ++ ) {
                this.lineHeight = this.lineHeight + this.operateH
                this.$textContainerElem.append($(`
                    <div class="pagingLine" style="top: ${this.lineHeight}px"></div>
                `))
            }
        }

        // 触发 change 的有三个场景：
        // 1. $textContainerElem.on('click keyup')
        // 2. $toolbarElem.on('click')
        // 3. editor.cmd.do()
        this.change = function () {
            // 判断是否有变化
            let currentHtml = this.txt.html()

            if (currentHtml.length === beforeChangeHtml.length) {
                // 需要比较每一个字符
                if (currentHtml === beforeChangeHtml) {
                    return
                }
            }

            // 执行，使用节流
            if (onChangeTimeoutId) {
                clearTimeout(onChangeTimeoutId)
            }
            onChangeTimeoutId = setTimeout(() => {
                // 触发配置的 onchange 函数
                if ( onchange && typeof onchange === 'function' ) {
                    onchange(currentHtml)
                }
                setPagingLine()
                beforeChangeHtml = currentHtml
            }, onchangeTimeout)
        }


        //* -------- 监听非表格切割事件 --------
        this.$textElem.on('mouseenter', () => {
            let scissor = document.getElementById(this.scissorId)
            scissor.style.display = 'inline-block'

            this.$textElem.on('mousemove',e => {
                let node = e.path[0]
                if (node.tagName === 'P') {
                    // 如果鼠标移动到编辑区域的内容上定位分页✂️位置
                    scissor.style.top = `${node.offsetTop}px`
                    // 不是在表格内的行，先将表格记录置为null
                    this.currentTdIndex = null

                    let parentNode = node.parentNode
                    for (let i=0; i < parentNode.children.length; i++) {
                        if (parentNode.children[i] === node) {
                            this.currentIndex = i
                            break
                        }
                    }
                }
            })
        })
        this.$textContainerElem.on('mouseleave', () => {
            this.$textElem.offType(this.$textElem, 'mousemove')
            let scissor = document.getElementById(this.scissorId)
            scissor.style.display = 'none'
        })
        // 拿到小✂️,绑定点击调用回调切割事件
        let $scissor = $(document.getElementById(this.scissorId))

        $scissor.on('click', e => {
            $scissor.css('display', 'none')
            let removeList = []

            // 在表格内切割的情况 这里不要用!!，index可能为0
            if (this.currentTdIndex === null) {
                for (let i=0; i < this.currentIndex; i++) {
                    removeList.push(this.$textElem[0].removeChild(this.$textElem[0].children[0]))
                }
            } else {
                const table = this.$textElem[0].children[this.currentIndex]
                const tbody = table.children[0]
                for (let i=0; i < this.currentIndex; i++) {
                    removeList.push(this.$textElem[0].removeChild(this.$textElem[0].children[0]))
                }
                let id = getRandom('table-index-')
                let html = `<table border="0" width="100%" cellpadding="0" cellspacing="0" id="${id}">`
                // 表头
                html += tbody.children[0].outerHTML
                // 被切行上面的tr
                for (let r = 1; r < this.currentTdIndex; r++) {
                    let tr = tbody.removeChild(tbody.children[1])
                    html += tr.outerHTML
                }
                html += '</table><p><br></p>'

                removeList.push($(html)[0])
            }

            // 获取当前page的索引
            let pageIndex
            let pages = this.$textContainerElem[0].parentNode.children
            for (let i = 0; i < pages.length; i++) {
                if (pages[i] === this.$textContainerElem[0]) {
                    pageIndex = i
                    break
                }
            }

            this.callback && this.callback(removeList, pageIndex);
        })

        //* -------- 为表格绑定事件 --------
        const Table = this.menus.menus.table

        this.tableIdList.forEach(id => Table._bindEvents(id))

        // -------- 绑定 onblur 事件 --------
        const onblur = config.onblur
        if (onblur && typeof onblur === 'function') {
            this.onblur = function () {
                const currentHtml = this.txt.html()
                onblur(currentHtml)
            }
        }

        // -------- 绑定 onfocus 事件 --------
        const onfocus = config.onfocus
        if (onfocus && typeof onfocus === 'function') {
            this.onfocus = function () {
                onfocus()
            }
        }

        // -------- 绑定 onClick 事件 --------
        const onclick = config.onclick
        if (onclick && typeof onclick === 'function') {
            this.onclick = function () {
              onclick()
            }
        }
    },

    // 创建编辑器
    create: function () {
        // 初始化配置信息
        this._initConfig()

        // 初始化 DOM
        this._initDom()

        // 封装 command API
        this._initCommand()

        // 封装 selection range API
        this._initSelectionAPI()

        // 添加 text
        this._initText()

        // 初始化菜单
        this._initMenus()

        // 添加 图片上传
        this._initUploadImg()

        // 初始化选区，将光标定位到内容尾部
        this.initSelection(true)

        // 绑定事件
        this._bindEvent()
    },

    //* 第三页自动填充的表单数据
    fillData(data) {
      const Table = this.menus.menus.table

      Table. _fillData(data)
    },

    // 解绑所有事件（暂时不对外开放）
    _offAllEvent: function () {
        $.offAll()
    }
}

export default Editor
