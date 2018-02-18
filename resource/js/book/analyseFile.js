(function() {

    var data;

    onmessage = function() {
        postMessage(analyseFile(arguments[0].data));    
    };

    function analyseFile(url) {
        var xhr = new XMLHttpRequest();
        xhr.open("get", url, false);
        xhr.responseType = "arraybuffer";
        try {
            xhr.onload = function() {
                callBack(this);
            };
            xhr.onerror = function() {
                data = { status: "fail", message: getErrorDescription(arguments[0]) };
            };
            xhr.send();
        } catch (e) {       /*for chrome(如果当前目录下找不到文件不会触发onerror必须捕获异常)*/
            data = { status: "fail", message: getErrorDescription(e) };
        } finally {
            return data;
        }
    }


    /*获取错误的信息描述*/
    function getErrorDescription(e) {
        if (e.name == "NetworkError") {
            return "当前目录下找不到此书籍！";
        } else if (!e.lengthComputable) {
            return "当前目录下找不到此书籍！";
        }
    }
    /*文件读取成功的回调函数*/
    function callBack(o) {

        var reg = /^\s*第*[零两一二三四五六七八九十百千0123456789]*[章节卷集部篇回]/; // 提取章节名称的正则(准确性不高)

        var chapterNameArr = [];                    // 章节名称数组 

        var chapterArr = [] ;                        // 章节数组

        var bf = o.response;                        // 文件的字节缓冲

        var int8Arr = new Int8Array(bf);            // 文件的int8array数组

        var encode = getFileEncode(int8Arr);        // 用来读取文件的编码 

        var start = 0;                              // 分割章节的标记  

        var textArr = new FileReaderSync().readAsText(new Blob([int8Arr]), encode).split("\r\n"); // 将每行文本存入数组

        textArr.forEach(function(x, y, z) {         // 遍历取出每一章的内容和章节名称
            if (reg.test(x)) {
                chapterArr.push(z.slice(start, y).map(function(x) {
                    return "<p>" + x + "</p>";
                }));
                chapterNameArr.push("<p title='"+x+"'>" + x + "</p>");
                start = y;
            }
        });
        chapterArr.push(textArr.slice(start, textArr.length).map(function(x) { // 读最后一章
            return "<p>" + x + "</p>";
        }));

        if (chapterArr[0] == "") {                  // txt第一行就是章节的情况
            chapterArr.shift();
        } else {
            chapterNameArr.unshift("<p>" + "序章" + "</p>");
        }

        data = {
            chapterArr: chapterArr,
            chapterNameArr: chapterNameArr,
            status: "success"
        };
    }

    /*获取读取文件的编码*/
    function getFileEncode(arr) {

        var head = arr.slice(0, 3);

        if (head[0] == -17 && head[1] == -69 && head[2] == -65) {   // 文件编码为utf-8,用utf-8编码读取
            return "utf-8";
        } else if (head[0] == -1 && head[1] == -2) {                // 文件编码为unicode,用gbk编码格式读取
            return "gbk";
        } else if (head[0] == -2 && head[1] == -1) {                // 文件编码为unicode-big-dedian,用gbk编码格式读取
            return "gbk";
        } else {                                                    // 文件编码为ANSI或其它编码或者为以上3个编码但是没有头文件信息,用gbk编码格式读取(此时读取可能为乱码)
            return "gbk";
        }
    }

})();