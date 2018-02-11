(function(){
	
	/*背景星星特效参数设置*/
	$(document.body).starfield({
		 starDensity: 1.0,	// 星空中星星的密度。基于像素比计算，值越大星星越多
  		 mouseScale: 0.2,	// 鼠标移动时星空的移动速度。值越大星空移动越快
  		 seedMovement: true // 是否在页面加载后就开始移动星空
	});
	/*跳转不同的页面*/
	$(".btn-book").click(function(){
		window.location.href="resource/page/book/bookShelf.html";
	});

	/*设置css变量*/
	$(".item").hover(function(){
		var _self=this;	
		var _selfW=$(this).width();
		var imgW=$(this).find("img").width();
		var btnH=$(this).find(".btn").height();
		document.body.style.setProperty("--scrollH", ($(_self).height()-btnH-20)+"px");		 	// 滚动下来的高度，配合css的translateY
		document.body.style.setProperty("--lineH", btnH+"px");  								// 行高
		document.body.style.setProperty("--btnW", imgW<_selfW?(imgW*0.8)+"px":"80%");	// btn宽度
	});
	
})();