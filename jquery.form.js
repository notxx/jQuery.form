(function($) {
if (!$ || !$.fn) return;
if (!console) // 避免IE下没有console出错
	window.console = { log: function () { } };

function submit(e) { // 提交
	e.stopPropagation();
	e.preventDefault();
	var $this = $(this),
		$form = $this.is("form") ? $this : $this.parents("form"),
		options = $form.data("form.options");
	// 使用jQuery.validationEngine验证表单
	if ($.isFunction($form.validationEngine) && !$form.validationEngine("validate")) { return; }
	// 使用jQuery.form-validator验证表单
	if ($.isFunction($form.isValid) && !$form.isValid(null, options.jfv)) {
		// TODO jfv的email验证对163.com似乎不对付
		$form.find("." + options.jfv.errorMessageClass).addClass(options.jfv.errorMessageExtra)
		$(".form-control").each(function() { // bootstrap
			var $this = $(this),
				$host = $this.closest(".form-group"),
				$icon = $this.data("$icon");
			if (!$icon || !$icon.length) return;
			if ($host.is(".has-error"))
				$icon.addClass("glyphicon-remove").removeClass("glyphicon-ok");
			else
				$icon.addClass("glyphicon-ok").removeClass("glyphicon-remove");
		});
		return;
	}
	var data = options.data.apply($form, [ $form ]); // 产生需要提交的数据
//	return console.log(data);
	$(":input", $form).attr("disabled", true); // 暂时禁用所有输入框
	$.ajax(options.target, {
		data : data,
		method : options.method
	}).then(function(data, textStatus, xhr) {
		$(":input", $form).attr("disabled", false); // 取消输入框禁用
		options.result.apply($this, [ false, data, xhr ]);
	}, function(xhr) {
		$(":input", $form).attr("disabled", false); // 取消输入框禁用
		var data = $.parseJSON(xhr.responseText);
		options.result.apply($this, [ xhr.status, data, xhr ]);
	});
}

function reset(e) { // 重置
	var $this = $(this),
		$form = $this.is("form") ? $this : $this.parents("form"),
		options = $form.data("form.options");
	$form.find("tr").removeClass("ui-state-error");
	// 隐藏jQuery.validationEngine的显示
	if ($.isFunction($form.validationEngine)) { $form.validationEngine("hide"); }
	// 隐藏jQuery.form-validator的显示
	if ($.isFunction($form.isValid)) {
		$form.find("." + options.jfv.errorMessageClass).remove();
		$(".form-control").each(function() { // bootstrap
			var $this = $(this),
				$host = $this.closest(".form-group"),
				$icon = $this.data("$icon");
			if (!$icon || !$icon.length) return;
			$icon.removeClass("glyphicon-remove").removeClass("glyphicon-ok");
		});
	}
	$form.find("input[type=hidden]").val(""); // 清空hidden域
	if ($.isFunction(options.reset)) { options.reset.apply(this, [ e ]); }
}

function keypress(e) { // 将输入中的回车转化为跳至下一个元件
	var $this = $(this), $form = $this.closest("form");
	switch ($this.attr("type")) {
	case "button":
	case "submit":
	case "reset":
		return; // 不在这些元件上转化跳转
	default:
	}
//	console.log(e);
	if (e.keyCode == 13) {
		e.preventDefault(); // 阻止提交
		var focusables = $(":focusable"),
			index = focusables.index(this, $form),
			next = focusables.eq(index + 1).length
				? focusables.eq(index + 1) : focusables.eq(0);
		if (next.is("input[type=submit]")) { return next.click(); } // 直接点击提交
		next.focus();
	}
}

var methods = {};
methods.init = function(options) {
	var $form = this;
	if (typeof options === "object")
		options = $.extend({}, defaults, options);
	else
		options = $.extend({}, defaults);
	$form.addClass("ui-form")
	.data("form.options", options)
	.on("submit.form", submit)
	.on("reset.form", reset);
	// 使用jQuery.validationEngine验证表单
	if ($.isFunction($form.validationEngine)) { $form.validationEngine({
		onValidationComplete: function(form, valid) {
			$form.find("tr").removeClass("ui-state-error");
			$.each($form.data("jqv").InvalidFields, function() {
				var $content = $(this).closest("tr");
				$content.addClass("ui-state-error");
			});
			return valid;
		},
		autoHidePrompt: true,
		autoHideDelay: 2000
	}); }
	// 使用jQuery.form-validator验证表单
	else if ($.isFunction($.validate) && $.isFunction($form.isValid)) {
		var jfv = options.jfv;
		jfv.form = $form;
		$.validate(jfv);
		$form.off("submit.form submit.validation");
		$form.on("submit.validation", submit);
		$(".form-control").each(function() { // bootstrap
			var $this = $(this),
				$host = $this.closest(".form-group").addClass("has-feedback"),
				$icon = $('<span class="glyphicon form-control-feedback">');
			$this.after($icon).data("$icon", $icon);
		});
	}
	// 添加ui-form-header / ui-form-content样式
	if (!($(".ui-form-header", $form).length || $(".ui-form-content", $form).length)) {
		$("th", $form).addClass("ui-form-header");
		$("td", $form).addClass("ui-form-content");
	}
	// 将按钮转化为jQuery按钮
	var $buttons = $form.find("input[type=button], input[type=submit], input[type=reset], button").addClass("ui-form-button btn btn-default");
	if ($.isFunction($buttons.button)) $buttons.button();
	$buttons.filter("[type=submit]").addClass("btn-primary");
	$buttons.filter("[type=reset]").addClass("btn-danger");
	// 添加ui-form-input样式
	if (!$(".ui-form-input", $form).length)
		$("input[type=text], input[type=password], input:not([type]), textarea", $form).addClass("ui-form-input");
	// 处理按键事件
	$("input", $form).on("keypress", keypress);
};
methods.message = function(content, type) {
	var $form = this;
	if ($.isFunction($form.validationEngine)) {
		$form.validationEngine("showPrompt", content, type);
//	} else if (console && console.log) {
//		console.log(content, type);
	} else {
		alert(content, type);
	}
};

var defaults = {
		data: function() { return this.serialize(); },
		jfv: {
			//errorMessagePosition: "top",
			errorMessageClass: "form-error",
			errorMessageExtra: "col-sm-offset-2 col-sm-10",
			validateOnBlur: false
		},
		method: "post",
		result: function(err, data, xhr) {	}
};

$.fn.form = function(method) {
	if(!this.length) return this;  // 没必要处理空集合
	var $form = this.is("form") ? this : this.closest("form");
	if (!$form.length) return this;

	if (typeof(method) == 'string' && method.charAt(0) != '_' && methods[method]) {
		// make sure init is called once
		if(method != "message") { methods.init.apply($form); }

		return methods[method].apply($form, Array.prototype.slice.call(arguments, 1));
	} else if (typeof method == 'object' || !method) {
		// default constructor with or without arguments
		methods.init.apply($form, arguments);
	} else {
		$.error('Method ' + method + ' does not exist in jQuery.form');
	}
	return this;
};

})(jQuery);
