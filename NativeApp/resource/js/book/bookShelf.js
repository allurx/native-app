(function(){
			/*构造函数*/
	function Book(file){
		/*文件名*/
		this.name=file.name.substr(0,file.name.lastIndexOf("."));

		/*文件类型*/
		this.fileType=file.type;
		
		/*文件的url*/		
		this.url="../../../file/"+file.name;

		/*书籍的类型*/
		this.bookType=Book.prototype.bookType;

	}

	Book.prototype={

		constructor : Book,

		nativeApp:{},		// nativeApp对象

		/*操作类型*/
		actionType:{

			notSupportLocalStorage:0, 		// 不支持LocalStorage对象	

			addBook:1,				  		// 添加书籍

			deleteBook:2,			  		// 删除书籍

			notTxtFile:3,			  		// 不是txt文件

			emptyBooks:4,			  		// 清空书架

			notSupportFileReader:5,    		// 不支持FileReader对象

			notSupportReadLocalFile:6		// 不支持本地文件的读取(浏览器限制)

		},

		/*book节点的html*/
		bookNode: function(){				 
				return "<li class='bookItem'>" +
							"<div class='book' style='z-index:99'>" +
								"<div class='startRead'>" +
									"<button type='button' class='btn btn-primary readBook'>开始阅读</button>"+
								"</div>" +
								"<div class='bookBody'>" +
									"<input type='hidden' class='md5' value="+this.md5+">"+ this.name+
								"</div>" +
								"<div class='bookBottom'>" +
									"<button type='button' class='btn btn-primary deleteBook'><span class='glyphicon glyphicon-trash' style='color: rgb(0, 0, 0); font-size: 16px;'></span></button>"+
								"</div>" +
							"</div>" +
						"</li>";
			},

		/*所有书籍的种类*/
		//typeList:["玄幻","奇幻","武侠","仙侠","科幻","末日","灵异","都市","职场","军事","历史","游戏","体育"],
		typeList:(function(){
					return Array.prototype.map.call(document.getElementsByClassName("bookType"),function(x){
						return x.innerText;
					});
				})(),

		/*默认的书籍类型*/
		bookType:"玄幻",   

		/*计算页面每行需要生成的li的间隔和数量(150y+(y+1)*x=w-60)*/
		marginL:(function(){		
					var w=$("#booksList").outerWidth();
					var maxLiNum=Math.floor((w-60)/150);
					function calculate(maxLiNum){
						var mL=(w-60-150*maxLiNum)/(maxLiNum+1);
						return mL>=30?mL:calculate(maxLiNum-1);
					}
					var marginL=calculate(maxLiNum);
					document.body.style.setProperty("--marginL", marginL+"px");
					return marginL;
				})(),

		/*bootstrap模态框*/
		modalNode: "<div class='modal fade' id='infoTip' tabindex='-1' role='dialog' aria-labelledby='myModalLabel' aria-hidden='true'>"+
						"<div class='modal-dialog'>"+
							"<div class='modal-content'>"+
								"<div class='modal-header'>"+
									"<button type='button' class='close' data-dismiss='modal' aria-hidden='true'></button>"+
									"<h2 class='modal-title' id='myModalLabel'>提示</h2>"+
								"</div>"+
								"<div class='modal-body'>"+
									"<h3></h3>"+
								"</div>"+
								"<div class='modal-footer'>"+
									"<button type='button' class='btn btn-primary btn-lg' data-dismiss='modal' id='modalSubmit'>确定</button>"+
									"<button type='button' class='btn btn-primary btn-lg' data-dismiss='modal'>取消</button>"+
								"</div>"+
							"</div>"+
						"</div>"+
					"</div>",

		/*弹出/隐藏模态框*/			
		toggleModal:function(msg){

			if($("#infoTip").length==0){
				$(document.body).append(this.modalNode);
			}
			if(msg.type==0 ||msg.type==1 || msg.type==3 ||msg.type==5 ||msg.type==6){	// 有些提示信息不需要取消按钮
				$("#infoTip").find(".modal-footer").find("button").eq(1).hide();
			}
			if(msg.type==2 || msg.type==4){					// 需要取消按钮的操作
				$("#infoTip").find(".modal-footer").find("button").eq(1).show();
			}
			$("#infoTip").find(".modal-body h3").html(msg.text);
			$("#infoTip").modal("show");

			/*给模态框的确定按钮绑定事件(不能用addEventListener,会绑定多个重复的click事件)*/
			document.getElementById("modalSubmit").onclick=function(){
				if(msg.type==2){		// 删除书籍
					Book.prototype.deleteBook(msg.md5Str);
					$("#booksList").find($(msg.obj).parents(".bookItem")).remove();
				}else if(msg.type==4){	// 清空书架
					Book.prototype.emptyBooks();
					$("#booksList").find(".bookItem").remove();
				}
			};			
			
		},

		/*获取NativeApp对象*/
		getNativeApp:function(){
			return JSON.parse(localStorage.getItem("NativeApp"));
		},

		/*设置nativeApp属性*/
		setNativeApp:function(){
			this.nativeApp=this.getNativeApp();
		},

		/*存储NativeApp对象*/
		saveNativeApp:function(){
			localStorage.setItem("NativeApp",JSON.stringify(this.nativeApp));
		},

		/*获取所有类型书籍的集合*/
		getAllTypeBooks:function(){
			return this.nativeApp.Books;
		},

		/*获取当前类型书籍的集合*/
		getCurrentTypeBooks:function(){
			var books;
			this.getAllTypeBooks().some(function(x){
				return x[0].bookType==this.bookType?(function(){
					books=x;
					return true;
				})():false;
			},this);
			return books;
		},	

		/*根据MD5获取单个book对象*/	
		getSinglelBook:function(md5Str){
			var book;
			this.getCurrentTypeBooks().slice(1).some(function(x){
				return x.md5==md5Str?(function(){
					book=x;
					return true;
				})():false;
			});
			return book;
		},

		/*初始化函数*/
		init:function(){
			if(this.judgeCompatibility()){
				if(this.getNativeApp()===null || this.getNativeApp()===undefined){				
					this.nativeApp.Books=this.typeList.map(function(x){	// 给Book.prototype注入nativeApp对象
						return [{bookType:x}];
					});				
					this.saveNativeApp();						// 保存刷新nativeApp对象			
				}else{
					this.nativeApp=this.getNativeApp();			// 给Book.prototype注入nativeApp对象
				}	
				$("#booksType").find("button").eq(0).trigger("click");	
			}						
		},

		/*判断book对象的唯一性*/
		unique:function(){		
				return this.getCurrentTypeBooks().slice(1).every(function(x){
					return this.md5==x.md5?false:true;
				},this);			    		    	
		 	},	

		 /*获取文件的MD5,然后调用unique方法判断是否已经添加过此书籍,
		 因为readAsArrayBuffer是异步读取,所以判断逻辑必须放在回调函数onload里面*/
		addBook:function(file){	
			if(file.type=="text/plain"){												
				var reader = new FileReader();
				reader.onload = function(e){						
					var book=new Book(file)		  	  // new一个新的book对象
					var md5Str= md5(this.result); // 文件类型正确计算MD5
					book.md5=md5Str;
					if(book.unique()) {
						book.getCurrentTypeBooks().push(book);
						book.saveNativeApp();
						$(book.bookNode()).prependTo($("#booksList"));
					}else{
						var msg = { text: "该类别书架中已经添加过此书籍！", type: book.actionType.addBook };
						book.toggleModal(msg);
					}							
				};
				reader.readAsArrayBuffer(file);																					
			}else{
				var msg = { text: "请添加txt类型的文件！", type: Book.prototype.actionType.notTxtFile };
				Book.prototype.toggleModal(msg);
			}		
			
		},

		/*删除单个书籍*/
		deleteBook:function(md5Str){
			this.getCurrentTypeBooks().some(function(x,y,z){
				return x.md5==md5Str?(function(){
					z.splice(y,1);
					this.saveNativeApp();
					return true;
				}.bind(this))():false;	// 将调用的对象传入some调用的匿名函数内
			},this);						// 将调用的对象传入some方法内
		},

		/*清空当前类别的书架*/
		emptyBooks:function(){
			this.getCurrentTypeBooks().length=1;
			this.saveNativeApp();
		},

		/*判断当前浏览器是否支持html5的新api*/
		judgeCompatibility: function(){
			if(!window.FileReader){
				var msg = { text: "当前浏览器似乎不支持本地文件读取,换个更新的浏览器试试！", type: this.actionType.notSupportFileReader };
				this.toggleModal(msg);
				return false;
			}else if(!window.localStorage){
				var msg = {text: "当前浏览器似乎不支持本地存储,换个更新的浏览器试试。", type: this.actionType.notSupportLocalStorage };
				this.toggleModal(msg);
				return false;
			}
			return true;
		},

		/*判断浏览器是否可以打开本地文件(webkit内核的浏览器不允许读取本地文件,需要设置启动参数)*/
		judgeBrowser:function(){
			var result;
			var xhr = new XMLHttpRequest();
        	xhr.open("get", "不要修改这个文件.txt", true);  
        	xhr.responseType = "arraybuffer";
        	xhr.onload = function() {
            	Book.prototype.init();
        	};
        	xhr.onerror=function(){
        		Book.prototype.toggleModal({text:"由于当前浏览器安全限制，可能无法读取本地文件！<br><br><a href='help.html' id='help' target='blank'>解决Firefox，Chrome，360等浏览器无法读取本地文件的方法</a>",type:Book.prototype.actionType.notSupportReadLocalFile});
        	};
        	xhr.send();
		}
		
	};

	/*添加书籍*/
	$("#file").change(function(){
		var file=this.files[0];
		Book.prototype.addBook(file);
		$(this).val("");
	});

	/*删除书籍*/
	$(document).on("click", ".deleteBook", function (){	
		var msg={text:"确定删除该书籍吗?",type:Book.prototype.actionType.deleteBook,md5Str:$(this).parents(".book").find(".md5").val(),obj:this};
		Book.prototype.toggleModal(msg);		
	});

	/*切换书籍类型*/
	$(".bookType").click(function(){
		$("#booksList").find(".bookItem").remove();
		Book.prototype.bookType=$(this).text();
		Book.prototype.getCurrentTypeBooks().slice(1).forEach(function(x){
			$(this.bookNode.call(x)).prependTo($("#booksList"));
		},Book.prototype);
		$(this).blur();	// 失去焦点
	});
	
	/*返回首页*/
	$(".glyphicon-home").click(function(){
		window.location.href="../../../index.html";
	});

	/*清空书架*/
	$(".glyphicon-trash").click(function(){
		var msg = { text: "确定清空该类别下的书籍吗?", type: Book.prototype.actionType.emptyBooks };
		Book.prototype.toggleModal(msg);
	});

	/*开始阅读*/
	$(document).on("click", ".readBook", function (){		
		var md5Str=$(this).parents(".book").find(".md5").val();
		var win=window.open("reading.html");		// open是异步的
		window.addEventListener("message", function(){
			Book.prototype.setNativeApp();			// 之前的书籍有可能已经保存过记录,需要重新设置nativeApp属性
			var book=Book.prototype.getSinglelBook(md5Str);
			win.postMessage(book,"*");				// 刷新或打开同一个页面，所有打开的相同的页面都会同时刷新
		},false);
	});


	return Book.prototype.judgeBrowser();

})();