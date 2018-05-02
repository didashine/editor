/*
    menu - table
*/
import $ from '../../util/dom-core.js'
import { getRandom } from '../../util/util.js'
import Panel from '../panel.js'
import _ from 'lodash'
// 构造函数
function Table(editor) {
    this.editor = editor
    this.$elem = $('<div class="w-e-menu"><i class="w-e-icon-table2"></i></div>')
    this.type = 'panel'

    // 当前是否 active 状态
    this._active = false

    //* 用于计算拖动选中表格
    this.startX = null
    this.startY = null
    this.endX = null
    this.endY = null
}

// 原型
Table.prototype = {
    constructor: Table,

    onClick: function () {
        if (this._active) {
            // 编辑现有表格
            this._createEditPanel()
        } else {
            // 插入新表格
            this._createInsertPanel()
        }
    },

    // 创建插入新表格的 panel
    _createInsertPanel: function () {
        // 用到的 id
        const btnInsertId = getRandom('btn')
        const textRowNum = getRandom('row')
        const textColNum = getRandom('col')

        const panel = new Panel(this, {
            width: 250,
            // panel 包含多个 tab
            tabs: [
                {
                    // 标题
                    title: '插入表格',
                    // 模板
                    tpl: `<div>
                        <p style="text-align:left; padding:5px 0;">
                            创建
                            <input id="${textRowNum}" type="text" value="5" style="width:40px;text-align:center;"/>
                            行
                            <input id="${textColNum}" type="text" value="5" style="width:40px;text-align:center;"/>
                            列的表格
                        </p>
                        <div class="w-e-button-container">
                            <button id="${btnInsertId}" class="right">插入</button>
                        </div>
                    </div>`,
                    // 事件绑定
                    events: [
                        {
                            // 点击按钮，插入表格
                            selector: '#' + btnInsertId,
                            type: 'click',
                            fn: () => {
                                const rowNum = parseInt($('#' + textRowNum).val())
                                const colNum = parseInt($('#' + textColNum).val())

                                if (rowNum && colNum && rowNum > 0 && colNum > 0) {
                                    // form 数据有效
                                    this._insert(rowNum, colNum)
                                }

                                // 返回 true，表示该事件执行完之后，panel 要关闭。否则 panel 不会关闭
                                return true
                            }
                        }
                    ]
                } // first tab end
            ]  // tabs end
        }) // panel end

        // 展示 panel
        panel.show()

        // 记录属性
        this.panel = panel
    },

    //* 插入新表格时候为该表格绑定事件， 对table的事件监听暂时缺少remove
    _bindEvents: function (id) {
        // 拿到插入的table
        let table = $(document.getElementById(id))

        // 拿到当前text的右键菜单
        let contextmenu = document.getElementById(this.editor.tContextmenuId)
        let $contextmenu = $(contextmenu)

        // 拿到菜单选项
        let li = contextmenu.children

        // 对li添加监听事件,通过dataset.type调用对应的方法
        for (let i=0; i < li.length; i++) {
            li[i].style.display = 'block'
            let event = `_${li[i].dataset.type}`
            this[event] ?
            li[i].addEventListener('click', e => {
              return this[event](e, table)
            }) : null
        }

        // 对表格右键进行监听
        table.on('contextmenu', e => {
            // 阻止浏览器默认事件和事件冒泡
            e.stopPropagation()
            e.preventDefault()
            // 根据点击事件设置右键菜单位置
            $contextmenu.css('left', `${e.clientX}px`)
                        .css('top', `${e.clientY}px`)
                        .css('display', 'block')
        })

        // 隐藏菜单
        table.on('click', e => {
            e.stopPropagation()
            $contextmenu.css('display', 'none')
        })

        // 处理表格选中
        table.on('mousedown', e => {

            //如果不是🖱左键点击，不触发记录表格坐标事件
            if (e.which !== 1) return

            // 记录鼠标选中开始时坐标
            table.startX = e.clientX
            table.startY = e.clientY

            // 拿到所有td
            let trs = table[0].children[0].children
            let tds = []
            for (let i=0; i < trs.length; i++) {
                let tdList = trs[i].children
                for (let j=0; j < tdList.length; j++) {
                    tds.push(tdList[j])
                }
            }

            // 每次点击从新将所有td置为未选中状态
            tds.forEach(td => {
                td.style.backgroundColor = 'inherit'
            })

            // 判断表格是否在拖动范围内
            let isInArea = rect => {
                let left = rect.left
                let rightToLeft = rect.left + rect.width
                let top = rect.top
                let bottomToTop = rect.top + rect.height

                if (table.startX <= table.endX ) {
                    if (table.startY <= table.endY) {
                        return !(rightToLeft <= table.startX
                            || left >= table.endX
                            || top >= table.endY
                            || bottomToTop <= table.startY)
                    } else {
                        return !(rightToLeft <= table.startX
                            || left >= table.endX
                            || top >= table.startY
                            || bottomToTop <= table.endY)
                    }
                } else {
                    if (table.startY <= table.endY) {
                        return !(rightToLeft <= table.endX
                            || left >= table.startX
                            || top >= table.endY
                            || bottomToTop <= table.startY)
                    } else {
                        return !(rightToLeft <= table.endX
                            || left >= table.startX
                            || top >= table.startY
                            || bottomToTop <= table.endY)
                    }
                }
            }

            table.on('mousemove', (e) => {
                e.stopPropagation()
                e.preventDefault()
                // 记录鼠标移动最后一个位置的坐标 这里this作用域指向当前table
                table.endX = e.clientX
                table.endY = e.clientY
                table.mergeList = []

                tds.forEach(td => {
                    let rect = td.getBoundingClientRect()

                    if (isInArea(rect)) {
                        // 暂存被选中的单元格dom
                        table.mergeList.push(td)

                        td.style.backgroundColor = 'rgba(35,132,209,0.25)'
                    } else {
                        td.style.backgroundColor = 'inherit'
                    }

                })
            })
        })


        table.on('mouseup', e => {
            table.offType(table, 'mousemove')
            table.on('mousemove', e => {
                return this._position(e)
            })
        })
        table.on('mousemove', e => {
            return this._position(e)
        })
        // 监听表格鼠标移动事件，记录表格分割✂️位置

    },

    //* 合并单元格 108行对li列表监听时触发
    _merge: function(e, table) {
        let mergeList = table.mergeList
        let locationList = []

        // 如果只选中一个单元格 直接return
        if ( !mergeList || (mergeList && mergeList.length <= 1)) return

        mergeList.forEach(td => {

            let location = td.dataset.location.split('.')
            location = location[0]+location[1]

            locationList.push(parseInt(location))
        })

        // 创建table时为每个td设置了data-location
        let max = _.max(locationList)
        let min = _.min(locationList)

        /**
         * minTd: 选中矩阵中最左上角的单元格
         * maxTd: 选中矩阵最右下角的单元格
         * row: 需要合并的行数
         * col: 需要合并的列数
         */
        let minTd, maxTd, row, col

        // 找到需要合并的单元格,将除了左上角其他的单元格display设置为none
        mergeList.forEach(td => {
            let location = td.dataset.location.split('.')
            location = location[0]+location[1]

            if (parseInt(location) === min) {
                minTd = td
            } else {
                if (parseInt(location) === max) {
                    maxTd = td
                }
            }
        })

        // 合并了几行几列
        row = parseInt(maxTd.dataset.location.split('.')[0]) - parseInt(minTd.dataset.location.split('.')[0]) + 1
        col = parseInt(maxTd.dataset.location.split('.')[1]) - parseInt(minTd.dataset.location.split('.')[1]) + 1

        minTd.rowSpan = row
        minTd.colSpan = col
        mergeList.forEach(td => {
            let location = td.dataset.location.split('.')
            location = location[0]+location[1]

            if (parseInt(location) !== min) {
                td.style.display = 'none'
            }
        })

        // 隐藏右键菜单
        let contextmenu = document.getElementById(this.editor.tContextmenuId)
        contextmenu.style.display = 'none'
    },

    // 插入表格
    _insert: function (rowNum, colNum) {
        //* 定义table id
        let id = getRandom('table-index-')

        // 拼接 table 模板
        let r, c
        let html = `<table border="0" width="100%" cellpadding="0" cellspacing="0" id="${id}">`
        for (r = 0; r < rowNum; r++) {
            html += '<tr>'
            for (c = 0; c < colNum; c++) {
                html += `<td rowspan="1" colspan="1" data-location="${r}.${c}">&nbsp;</td>`
            }
            html += '</tr>'
        }
        html += '</table><p><br></p>'

        // 执行命令
        //* 增加回调为当前表格绑定事件
        const editor = this.editor
        editor.cmd.do('insertHTML', html, () => {
            this._bindEvents(id)
        })

        // 防止 firefox 下出现 resize 的控制点
        editor.cmd.do('enableObjectResizing', false)
        editor.cmd.do('enableInlineTableEditing', false)
    },

    //* 外部有表格数据需要填充时调用
    _fillData: function (data) {
        //* 定义table id
        let id = getRandom('table-index-')

        // 拼接 table 模板
        let r, c
        let html = `<table border="0" width="100%" cellpadding="0" cellspacing="0" id="${id}">`
        for (r = 0; r < data.length; r++) {
            html += '<tr>'
            for (c = 0; c < data[r].length; c++) {
                html += `<td rowspan="1" colspan="1" data-location="${r}.${c}">${data[r][c]}</td>`
            }
            html += '</tr>'
        }
        html += '</table><p><br></p>'

        // 执行命令
        //* 增加回调为当前表格绑定事件
        const editor = this.editor
        editor.cmd.do('insertHTML', html, () => {
            this._bindEvents(id)
        })

        // 防止 firefox 下出现 resize 的控制点
        editor.cmd.do('enableObjectResizing', false)
        editor.cmd.do('enableInlineTableEditing', false)
    },
    // 创建编辑表格的 panel
    _createEditPanel: function () {
        // 可用的 id
        const addRowBtnId = getRandom('add-row')
        const addColBtnId = getRandom('add-col')
        const delRowBtnId = getRandom('del-row')
        const delColBtnId = getRandom('del-col')
        const delTableBtnId = getRandom('del-table')

        // 创建 panel 对象
        const panel = new Panel(this, {
            width: 320,
            // panel 包含多个 tab
            tabs: [
                {
                    // 标题
                    title: '编辑表格',
                    // 模板
                    tpl: `<div>
                        <div class="w-e-button-container" style="border-bottom:1px solid #f1f1f1;padding-bottom:5px;margin-bottom:5px;">
                            <button id="${addRowBtnId}" class="left">增加行</button>
                            <button id="${delRowBtnId}" class="red left">删除行</button>
                            <button id="${addColBtnId}" class="left">增加列</button>
                            <button id="${delColBtnId}" class="red left">删除列</button>
                        </div>
                        <div class="w-e-button-container">
                            <button id="${delTableBtnId}" class="gray left">删除表格</button>
                        </dv>
                    </div>`,
                    // 事件绑定
                    events: [
                        {
                            // 增加行
                            selector: '#' + addRowBtnId,
                            type: 'click',
                            fn: () => {
                                this._addRow()
                                // 返回 true，表示该事件执行完之后，panel 要关闭。否则 panel 不会关闭
                                return true
                            }
                        },
                        {
                            // 增加列
                            selector: '#' + addColBtnId,
                            type: 'click',
                            fn: () => {
                                this._addCol()
                                // 返回 true，表示该事件执行完之后，panel 要关闭。否则 panel 不会关闭
                                return true
                            }
                        },
                        {
                            // 删除行
                            selector: '#' + delRowBtnId,
                            type: 'click',
                            fn: () => {
                                this._delRow()
                                // 返回 true，表示该事件执行完之后，panel 要关闭。否则 panel 不会关闭
                                return true
                            }
                        },
                        {
                            // 删除列
                            selector: '#' + delColBtnId,
                            type: 'click',
                            fn: () => {
                                this._delCol()
                                // 返回 true，表示该事件执行完之后，panel 要关闭。否则 panel 不会关闭
                                return true
                            }
                        },
                        {
                            // 删除表格
                            selector: '#' + delTableBtnId,
                            type: 'click',
                            fn: () => {
                                this._delTable()
                                // 返回 true，表示该事件执行完之后，panel 要关闭。否则 panel 不会关闭
                                return true
                            }
                        }
                    ]
                }
            ]
        })
        // 显示 panel
        panel.show()
    },

    // 获取选中的单元格的位置信息
    _getLocationData: function () {
        const result = {}
        const editor = this.editor
        const $selectionELem = editor.selection.getSelectionContainerElem()
        if (!$selectionELem) {
            return
        }
        const nodeName = $selectionELem.getNodeName()
        if (nodeName !== 'TD' && nodeName !== 'TH') {
            return
        }

        // 获取 td index
        const $tr = $selectionELem.parent()
        const $tds = $tr.children()
        const tdLength = $tds.length
        $tds.forEach((td, index) => {
            if (td === $selectionELem[0]) {
                // 记录并跳出循环
                result.td = {
                    index: index,
                    elem: td,
                    length: tdLength
                }
                return false
            }
        })

        // 获取 tr index
        const $tbody = $tr.parent()
        const $trs = $tbody.children()
        const trLength = $trs.length
        $trs.forEach((tr, index) => {
            if (tr === $tr[0]) {
                // 记录并跳出循环
                result.tr = {
                    index: index,
                    elem: tr,
                    length: trLength
                }
                return false
            }
        })

        // 返回结果
        return result
    },

    // 增加行
    _addRow: function () {
        // 获取当前单元格的位置信息
        const locationData = this._getLocationData()
        if (!locationData) {
            return
        }
        const trData = locationData.tr
        const $currentTr = $(trData.elem)
        const tdData = locationData.td
        const tdLength = tdData.length

        // 拼接即将插入的字符串
        const newTr = document.createElement('tr')
        let tpl = '', i
        for (i = 0; i < tdLength; i++) {
            tpl += '<td>&nbsp;</td>'
        }
        newTr.innerHTML = tpl
        // 插入
        $(newTr).insertAfter($currentTr)
    },

    // 增加列
    _addCol: function () {
        // 获取当前单元格的位置信息
        const locationData = this._getLocationData()
        if (!locationData) {
            return
        }
        const trData = locationData.tr
        const tdData = locationData.td
        const tdIndex = tdData.index
        const $currentTr = $(trData.elem)
        const $trParent = $currentTr.parent()
        const $trs = $trParent.children()

        // 遍历所有行
        $trs.forEach(tr => {
            const $tr = $(tr)
            const $tds = $tr.children()
            const $currentTd = $tds.get(tdIndex)
            const name = $currentTd.getNodeName().toLowerCase()

            // new 一个 td，并插入
            const newTd = document.createElement(name)
            $(newTd).insertAfter($currentTd)
        })
    },

    // 删除行
    _delRow: function () {
        // 获取当前单元格的位置信息
        const locationData = this._getLocationData()
        if (!locationData) {
            return
        }
        const trData = locationData.tr
        const $currentTr = $(trData.elem)
        $currentTr.remove()
    },

    // 删除列
    _delCol: function () {
        // 获取当前单元格的位置信息
        const locationData = this._getLocationData()
        if (!locationData) {
            return
        }
        const trData = locationData.tr
        const tdData = locationData.td
        const tdIndex = tdData.index
        const $currentTr = $(trData.elem)
        const $trParent = $currentTr.parent()
        const $trs = $trParent.children()

        // 遍历所有行
        $trs.forEach(tr => {
            const $tr = $(tr)
            const $tds = $tr.children()
            const $currentTd = $tds.get(tdIndex)
            // 删除
            $currentTd.remove()
        })
    },

    // 删除表格
    _delTable: function () {
        const editor = this.editor
        const $selectionELem = editor.selection.getSelectionContainerElem()
        if (!$selectionELem) {
            return
        }
        const $table = $selectionELem.parentUntil('table')
        if (!$table) {
            return
        }
        $table.remove()
    },

    // 试图改变 active 状态
    tryChangeActive: function (e) {
        const editor = this.editor
        const $elem = this.$elem
        const $selectionELem = editor.selection.getSelectionContainerElem()
        if (!$selectionELem) {
            return
        }
        const nodeName = $selectionELem.getNodeName()
        if (nodeName === 'TD' || nodeName === 'TH') {
            this._active = true
            $elem.addClass('w-e-active')
        } else {
            this._active = false
            $elem.removeClass('w-e-active')
        }
    },
    _position: function(e) {
        let tdNode = e.path[0]
        let tableNode = $(tdNode).parentUntil('table')[0]

        let scissor = document.getElementById(this.editor.scissorId)
        scissor.style.display = 'inline-block'
        // 表格内✂️定位
        scissor.style.top = `${tdNode.offsetTop + tableNode.offsetTop}px`

        let parentNode = tableNode.parentNode
        for (let i=0; i < parentNode.children.length; i++) {
            if (parentNode.children[i] === tableNode) {
                this.editor.currentIndex = i
                break
            }
        }

        // 拿到当前tr在表格中的第几行并记录 用于表格分页
        let trNode = e.path[0].parentNode
        this.editor.currentTdIndex = trNode.rowIndex;
    }
}

export default Table
