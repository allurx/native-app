(function() {

    /*全局nativeApp对象*/
    var nativeApp = JSON.parse(window.localStorage.getItem("NativeApp"));

    /*全局book对象*/
    var book;

    window.addEventListener("message", function() {
        book = arguments[0].data;
        console.log(book);
        init();
        window.removeEventListener("message",arguments.callee, false); // 移除message事件,不然win.postMessage(book,"*")会触发
    }, false);

    window.opener.postMessage("", "*");

    /*保存书签*/
    function upDateBook(book) {
        try {
            book.scrollTop = $("#txt").scrollTop();
            nativeApp.Books.some(function(x) {
                return x[0].bookType == book.bookType ? (function() {
                    return x.some(function(y) {
                        return y.md5 == book.md5 ? (function() {
                            y.chapterIndex = book.chapterIndex;
                            y.scrollTop = book.scrollTop;
                            window.localStorage.setItem("NativeApp", JSON.stringify(nativeApp));
                            return true;
                        })() : false;
                    });
                })() : false;
            });
            toggleModal({ text: "书签保存成功！", type: 2 });
        } catch (e) {
            toggleModal({ text: "书签保存失败！,请重新尝试。", type: 3 });
        }
    }

    /*bootstrap模态框*/
    var modalNode = "<div class='modal fade' id='infoTip' tabindex='-1' role='dialog' aria-labelledby='myModalLabel' aria-hidden='true'>" +
        "<div class='modal-dialog'>" +
        "<div class='modal-content'>" +
        "<div class='modal-header'>" +
        "<button type='button' class='close' data-dismiss='modal' aria-hidden='true'></button>" +
        "<h2 class='modal-title' id='myModalLabel'>提示</h2>" +
        "</div>" +
        "<div class='modal-body'>" +
        "<h3></h3>" +
        "</div>" +
        "<div class='modal-footer'>" +
        "<button type='button' class='btn btn-primary btn-lg' data-dismiss='modal' id='modalSubmit'>确定</button>" +
        "</div>" +
        "</div>" +
        "</div>" +
        "</div>";
    /*弹出模态框*/
    function toggleModal(msg) {
        if ($("#infoTip").length == 0) {
            $("#container").append(modalNode);
        }
        if (msg.type == 0) {
            book.chapterIndex = 0;
        } else if (msg.type == 1) {
            book.chapterIndex = book.chapterNum - 1;
        }
        $("#infoTip").find(".modal-body h3").html(msg.text);
        $("#infoTip").modal("show");

    }

    /*初始化*/
    function init() {
        window.document.title = book.name;
        $(document.body).css("background-color", book.backGroundColor);
        $("#txt").css("font-size", book.fontSize);
        $("#head-left span").html(formatFiwame()); // 添加书名
        readBook(book.url);
    }

    /*添加书名号*/
    function formatFiwame() {
        var bookName = book.name;
        if (bookName.substr(0, 1) != "《") {
            bookName = "《" + bookName;
        }
        if (bookName.substr(bookName.length - 1) != "》") {
            bookName = bookName + "》";
        }
        return bookName;
    }

    /*读取txt文件*/
    function readBook(url) {
        $(".pageOver").show();

        try {
            var worker = new Worker("../../js/book/analyseFile.js"); // js无法在本地加载的js中创建worker，需要修改启动参数

            worker.onmessage = function() {

                var data = arguments[0].data;

                if (data.status == "success") {

                    book.chapterIndex = (book.chapterIndex === undefined ? 0 : book.chapterIndex); // 当前阅读的章节下标默认是第一章

                    book.scrollTop = (book.scrollTop === undefined ? 0 : book.scrollTop);

                    book.chapterArr = data.chapterArr; // 章节数组

                    book.chapterNameArr = data.chapterNameArr; // 章节名称数组

                    book.chapterNum = book.chapterNameArr.length; // 章节数量

                    /*追加章节名*/
                    $("#directory-body").append(book.chapterNameArr);

                    /*上次阅读的内容*/
                    $("#txt").html(book.chapterArr[book.chapterIndex]).scrollTop(book.scrollTop);

                    /*切换章节*/
                    $("#directory").find("p").each(function(index) {
                        $(this).click(function() {
                            $("#txt").html(book.chapterArr[index]).scrollTop(0);
                            book.chapterIndex = index;
                            countPercentage();
                        });
                    });
                    countPercentage();
                } else {
                    toggleModal({ text: data.message });
                }
                $(".pageOver").hide();
                worker.terminate();
            };
            worker.postMessage(url);
        } catch (e) {
            if (e.name == "SecurityError") {
                toggleModal({ text: "当前浏览器安全限制，无法读取本地文件！<br><br><a href='help.html' id='help' target='blank'>解决Firefox，Chrome，360等浏览器无法读取本地文件的方法</a>" });
                $(".pageOver").hide();
            }
        }
    }

    /*阅读的百分比*/
    function countPercentage() {
        $(".percentage").html((((Number(book.chapterIndex) + 1) / book.chapterNum) * 100).toFixed(2) + "%");
    }

    /*切换上一章*/
    $(".Previous").click(function() {
        book.chapterArr[--book.chapterIndex] !== undefined ? $("#txt").html(book.chapterArr[book.chapterIndex]).scrollTop(0) : toggleModal({ text: "已经是第一章了。", type: 0 });
        countPercentage();
    });

    /*切换下一章*/
    $(".next").click(function() {
        book.chapterArr[++book.chapterIndex] !== undefined ? $("#txt").html(book.chapterArr[book.chapterIndex]).scrollTop(0) : toggleModal({ text: "已经是最后一章了。", type: 1 });
        countPercentage();
    });

    /*保存阅读记录*/
    $("#saveRecord").click(function() {
        upDateBook(book);
    });

    /*滚动到页面顶部*/
    $(".pageTop").click(function() {
        $("#txt").scrollTop(0);
    });

    /*滚动到页面底部*/
    $(".pageBottom").click(function() {
        $("#txt").scrollTop($("#txt")[0].scrollHeight);
    });

    /*键盘↑ ↓ ← → 事件*/
    $(document).keydown(function() {
        var key = arguments[0].which;
        if (key == 37) { // 上一章
            $(".Previous").click();
        } else if (key == 39) { // 下一章
            $(".next").click();
        } else if (key == 40 || key == 38) { // 上下滚动
            $("#txt").focus();
        }
    });

    /*获取颜色的16进制值*/
    function getHexColor(colorStr) {
        var hexStr = "#";
        var arr = colorStr.replace("rgba", "").replace("rgb", "").replace("(", "").replace(")", "").replace(/\s+/g, "").split(",");
        if (colorStr.substr(0, 4) == "rgba") {
            for (var i = 0; i < arr.length - 1; i++) {
                hexStr = hexStr + (parseInt(Number(arr[i]) + (1 - arr[3]) * 255).toString(16).length == 2 ? parseInt(Number(arr[i]) + (1 - arr[3]) * 255).toString(16) : "0" + parseInt(Number(arr[i]) + (1 - arr[3]) * 255).toString(16));
            }
        } else if (colorStr.substr(0, 3) == "rgb") {
            for (var i = 0; i < arr.length; i++) {
                hexStr = hexStr + (parseInt(arr[i]).toString(16).length == 2 ? parseInt(arr[i]).toString(16) : "0" + parseInt(arr[i]).toString(16));
            }
        } else if (colorStr.substr(0, 1) == "#") {
            hexStr = colorStr;
        }
        return hexStr;
    }

    /*关闭设置页面后的回调函数，判断是否保存设置的参数*/
    function setUpCallBack() {
        book.fontSize === undefined ? $("#txt").css("font-size", "20px") : $("#txt").css("font-size", book.fontSize);
        book.backGroundColor === undefined ? $(document.body).css("background-color", "#be966e") : $(document.body).css("background-color", book.backGroundColor);
    }

    /*显示设置页面*/
    $("#setUp").click(function() {
        $("#setUpPage").css("display") == "none" ? (function() {
            $("#setUpPage").show();
            book.fontSize === undefined ? $("#font-value").html(20) : $("#font-value").html(parseInt(book.fontSize));
            book.backGroundColor === undefined ? $("#myColor").val("#be966e") : $("#myColor").val(getHexColor(book.backGroundColor))
        })() : $("#setUpPage").hide(0, function() {
            setUpCallBack();
        });
    });

    /*设置页面的关闭按钮*/
    $("#close-btn").click(function() {
        $("#setUpPage").hide(0, function() {
            setUpCallBack();
        });
    });

    /*改变字体大小*/
    $(".plus").click(function() {
        var size = $("#txt").css("font-size").replace("px", "");
        size < 30 ? $("#txt").css("font-size", ++size) : $("#txt").css("font-size", size);
        $("#font-value").html(size);
    });

    $(".minus").click(function() {
        var size = $("#txt").css("font-size").replace("px", "");
        size > 15 ? $("#txt").css("font-size", --size) : $("#txt").css("font-size", size);
        $("#font-value").html(size);
    });

    /*改变背景颜色*/
    $("#myColor").change(function() {
        $(document.body).css("background-color", $(this).val());
    });

    /*拖动事件结束改变拖动对象的位置*/
    function position(obj) {
        var availWidth = $(window).width();
        var availHeight = $(window).height();
        var w = obj.outerWidth();
        var h = obj.outerHeight();
        var l = obj.css("left").replace("px", "");
        var t = obj.css("top").replace("px", "");
        if (t < 0 && l < 0) { // 超过左上角
            obj.animate({ top: 0, left: 0 });
        } else if (t < 0 && l > availWidth - w) { // 超过右上角
            obj.animate({ top: 0, left: availWidth - w });
        } else if (t > availHeight - h && l > availWidth - w) { // 超过右下角
            obj.animate({ top: availHeight - h, left: availWidth - w });
        } else if (l < 0 && t > availHeight - h) { // 超过左下角
            obj.animate({ top: availHeight - h, left: 0 });
        } else if (t < 0) { // 超过顶部
            obj.animate({ top: 0 });
        } else if (l < 0) { // 超过左部
            obj.animate({ left: 0 });
        } else if (t > availHeight - h) { // 超过底部
            obj.animate({ top: availHeight - h });
        } else if (l > availWidth - w) { // 超过右部
            obj.animate({ left: availWidth - w });
        }
        return obj;
    }

    /*拖动事件*/
    $(document).on("mousedown", ".dragObj", function() {
        var e = arguments[0];
        if (e.button == 0) { // 鼠标左键
            var obj = $(this);
            var disx = e.clientX - $(this).css("left").replace("px", ""); // 鼠标横坐标点到div的左边界距离
            var disy = e.clientY - $(this).css("top").replace("px", ""); // 鼠标纵坐标点到div的上边界距离
            $(document).mousemove(function() {
                var e = arguments[0];
                obj.css("cursor", "move");
                var left = e.clientX - disx; // 获取div距离屏幕左边的距离
                var top = e.clientY - disy; // 获取fdiv距离屏幕顶部的距离 
                obj.css({ "left": left, "top": top });
            });
            $(document).mouseup(function() {
                position(obj).css("cursor", "auto");
                $(document).unbind("mousemove"); // 移除mousemove事件
                $(document).unbind("mouseup"); // 移除mouseup事件 
            });
        }
    });

    /*保存设置参数*/
    $("#save-setUp").click(function() {
        try {
            book.fontSize = $("#font-value").html() + "px";
            book.backGroundColor = $("#myColor").val();
            nativeApp.Books.some(function(x) {
                return x[0].bookType == book.bookType ? (function() {
                    return x.some(function(y) {
                        return y.md5 == book.md5 ? (function() {
                            y.fontSize = book.fontSize;
                            y.backGroundColor = book.backGroundColor;
                            window.localStorage.setItem("NativeApp", JSON.stringify(nativeApp));
                            return true;
                        })() : false;
                    });
                })() : false;
            });
            toggleModal({ text: "保存成功！", type: 4 });
        } catch (e) {
            toggleModal({ text: "保存失败！,请重新尝试。", type: 5 });
        }
    });

    // 目录显示和隐藏
    $("#chapter-btn").click(function(){
        $("#directory").css("display")=="none"?$("#directory").show():$("#directory").hide();
    });

    

})();