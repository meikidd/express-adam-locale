/*
---
name: Date
...
*/


/*<!ES5>*/
Date.extend('now', function(){
	return +(new Date);
});
/*</!ES5>*/