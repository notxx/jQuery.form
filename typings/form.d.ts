/// <reference path="jquery/jquery.d.ts"/>

interface Form {
	// init
	(method = "init", options): void
	// message
	(method = "message", content, type): void
}

interface FormOptions {
	data: (data:any)=>any
	jfv: any
	target: string
	method: string
	result: (error:Error, data:any, xhr:XMLHttpRequest)=>void | ResultOptions | JQuery
	succeed: (data:any)=>void 
	failed: (error:Error)=>void 
}

interface ResultOptions {
	$table: JQuery
	$modal: JQuery
}

interface JQuery {
	form: Form
	modal?: Function
	table?: Function
	validationEngine?: Function
	isValid?: Function
}