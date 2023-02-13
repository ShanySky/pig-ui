import { nextTick, defineAsyncComponent } from 'vue';
import type { App } from 'vue';
import * as svg from '@element-plus/icons-vue';
import router from '/@/router/index';
import pinia from '/@/stores/index';
import { storeToRefs } from 'pinia';
import { useThemeConfig } from '/@/stores/themeConfig';
import { i18n } from '/@/i18n/index';
import { Local } from '/@/utils/storage';
import { verifyUrl } from '/@/utils/toolsValidate';
import request from "/@/utils/request";
import { useMessage } from "/@/hooks/message";
// @ts-ignore
import * as CryptoJS from "crypto-js";

// 引入组件
const SvgIcon = defineAsyncComponent(() => import('/@/components/svgIcon/index.vue'));

/**
 * 导出全局注册 element plus svg 图标
 * @param app vue 实例
 * @description 使用：https://element-plus.gitee.io/zh-CN/component/icon.html
 */
export function elSvg(app: App) {
	const icons = svg as any;
	for (const i in icons) {
		app.component(`ele-${icons[i].name}`, icons[i]);
	}
	app.component('SvgIcon', SvgIcon);
}

/**
 * 设置浏览器标题国际化
 * @method const title = useTitle(); ==> title()
 */
export function useTitle() {
	const stores = useThemeConfig(pinia);
	const { themeConfig } = storeToRefs(stores);
	nextTick(() => {
		let webTitle = '';
		let globalTitle: string = themeConfig.value.globalTitle;
		const { path, meta } = router.currentRoute.value;
		if (path === '/login') {
			webTitle = <string>meta.title;
		} else {
			webTitle = setTagsViewNameI18n(router.currentRoute.value);
		}
		document.title = `${webTitle} - ${globalTitle}` || globalTitle;
	});
}

/**
 * 设置 自定义 tagsView 名称、 自定义 tagsView 名称国际化
 * @param params 路由 query、params 中的 tagsViewName
 * @returns 返回当前 tagsViewName 名称
 */
export function setTagsViewNameI18n(item: any) {
	let tagsViewName: string = '';
	const { query, params, meta } = item;
	if (query?.tagsViewName || params?.tagsViewName) {
		if (/\/zh-cn|en|zh-tw\//.test(query?.tagsViewName) || /\/zh-cn|en|zh-tw\//.test(params?.tagsViewName)) {
			// 国际化
			const urlTagsParams = (query?.tagsViewName && JSON.parse(query?.tagsViewName)) || (params?.tagsViewName && JSON.parse(params?.tagsViewName));
			tagsViewName = urlTagsParams[i18n.global.locale.value];
		} else {
			// 非国际化
			tagsViewName = query?.tagsViewName || params?.tagsViewName;
		}
	} else {
		// 非自定义 tagsView 名称
		tagsViewName = i18n.global.t(meta.title);
	}
	return tagsViewName;
}

/**
 * 图片懒加载
 * @param el dom 目标元素
 * @param arr 列表数据
 * @description data-xxx 属性用于存储页面或应用程序的私有自定义数据
 */
export const lazyImg = (el: string, arr: EmptyArrayType) => {
	const io = new IntersectionObserver((res) => {
		res.forEach((v: any) => {
			if (v.isIntersecting) {
				const { img, key } = v.target.dataset;
				v.target.src = img;
				v.target.onload = () => {
					io.unobserve(v.target);
					arr[key]['loading'] = false;
				};
			}
		});
	});
	nextTick(() => {
		document.querySelectorAll(el).forEach((img) => io.observe(img));
	});
};

/**
 * 全局组件大小
 * @returns 返回 `window.localStorage` 中读取的缓存值 `globalComponentSize`
 */
export const globalComponentSize = (): string => {
	const stores = useThemeConfig(pinia);
	const { themeConfig } = storeToRefs(stores);
	return Local.get('themeConfig')?.globalComponentSize || themeConfig.value?.globalComponentSize;
};

/**
 * 对象深克隆
 * @param obj 源对象
 * @returns 克隆后的对象
 */
export function deepClone(obj: EmptyObjectType) {
	let newObj: EmptyObjectType;
	try {
		newObj = obj.push ? [] : {};
	} catch (error) {
		newObj = {};
	}
	for (let attr in obj) {
		if (obj[attr] && typeof obj[attr] === 'object') {
			newObj[attr] = deepClone(obj[attr]);
		} else {
			newObj[attr] = obj[attr];
		}
	}
	return newObj;
}

/**
 * 判断是否是移动端
 */
export function isMobile() {
	if (
		navigator.userAgent.match(
			/('phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone')/i
		)
	) {
		return true;
	} else {
		return false;
	}
}

/**
 * 判断数组对象中所有属性是否为空，为空则删除当前行对象
 * @description @感谢大黄
 * @param list 数组对象
 * @returns 删除空值后的数组对象
 */
export function handleEmpty(list: EmptyArrayType) {
	const arr = [];
	for (const i in list) {
		const d = [];
		for (const j in list[i]) {
			d.push(list[i][j]);
		}
		const leng = d.filter((item) => item === '').length;
		if (leng !== d.length) {
			arr.push(list[i]);
		}
	}
	return arr;
}

/**
 * 打开外部链接
 * @param val 当前点击项菜单
 */
export function handleOpenLink(val: RouteItem) {
	const { origin, pathname } = window.location;
	router.push(val.path);
	if (verifyUrl(<string>val.meta?.isLink)) window.open(val.meta?.isLink);
	else window.open(`${val.meta?.isLink}`);
}

/**
 * 打开小窗口
 */
export const openWindow = (url: string, title: string, w: number, h: number) => {
	// Fixes dual-screen position                            Most browsers       Firefox
	const dualScreenLeft =
		window.screenLeft !== undefined ? window.screenLeft : screen.left;
	const dualScreenTop =
		window.screenTop !== undefined ? window.screenTop : screen.top;

	const width = window.innerWidth
		? window.innerWidth
		: document.documentElement.clientWidth
			? document.documentElement.clientWidth
			: screen.width;
	const height = window.innerHeight
		? window.innerHeight
		: document.documentElement.clientHeight
			? document.documentElement.clientHeight
			: screen.height;

	const left = width / 2 - w / 2 + dualScreenLeft;
	const top = height / 2 - h / 2 + dualScreenTop;
	return window.open(
		url,
		title,
		"toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=yes, copyhistory=no, width=" +
		w +
		", height=" +
		h +
		", top=" +
		top +
		", left=" +
		left
	);
};
/**
 *加密处理
 */
export function encryption(params: any) {
	let { data, type, param, key } = params;
	const result = JSON.parse(JSON.stringify(data));
	if (type === "Base64") {
		param.forEach((ele: any) => {
			result[ele] = btoa(result[ele]);
		});
	} else {
		param.forEach((ele: any) => {
			var data = result[ele];
			key = CryptoJS.enc.Latin1.parse(key);
			var iv = key;
			// 加密
			var encrypted = CryptoJS.AES.encrypt(data, key, {
				iv: iv,
				mode: CryptoJS.mode.CFB,
				padding: CryptoJS.pad.NoPadding
			});
			result[ele] = encrypted.toString();
		});
	}
	return result;
}

/**
 *
 * @param url 目标下载接口
 * @param query 查询参数
 * @param fileName 文件名称
 * @returns {*}
 */
export function downBlobFile(url: any, query: any, fileName: string) {
	return request({
		url: url,
		method: "get",
		responseType: "blob",
		params: query
	}).then(response => {
		// 处理返回的文件流
		const blob = response;
		if (blob && blob.size === 0) {
			useMessage().error("内容为空，无法下载");
			return;
		}
		const link = document.createElement("a");
		// @ts-ignore
		link.href = URL.createObjectURL(blob);
		// @ts-ignore
		link.download = fileName;
		document.body.appendChild(link);
		link.click();
		window.setTimeout(function () {
			// @ts-ignore
			URL.revokeObjectURL(blob);
			document.body.removeChild(link);
		}, 0);
	});
}



/**
 * 统一批量导出
 * @method elSvg 导出全局注册 element plus svg 图标
 * @method useTitle 设置浏览器标题国际化
 * @method setTagsViewNameI18n 设置 自定义 tagsView 名称、 自定义 tagsView 名称国际化
 * @method lazyImg 图片懒加载
 * @method globalComponentSize() element plus 全局组件大小
 * @method deepClone 对象深克隆
 * @method isMobile 判断是否是移动端
 * @method handleEmpty 判断数组对象中所有属性是否为空，为空则删除当前行对象
 * @method handleOpenLink 打开外部链接
 */
const other = {
	elSvg: (app: App) => {
		elSvg(app);
	},
	useTitle: () => {
		useTitle();
	},
	setTagsViewNameI18n(route: RouteToFrom) {
		return setTagsViewNameI18n(route);
	},
	lazyImg: (el: string, arr: EmptyArrayType) => {
		lazyImg(el, arr);
	},
	globalComponentSize: () => {
		return globalComponentSize();
	},
	deepClone: (obj: EmptyObjectType) => {
		return deepClone(obj);
	},
	isMobile: () => {
		return isMobile();
	},
	handleEmpty: (list: EmptyArrayType) => {
		return handleEmpty(list);
	},
	handleOpenLink: (val: RouteItem) => {
		handleOpenLink(val);
	},
	encryption: (data: any) => {
		return encryption(data)
	},
	downBlobFile: (url: any, query: any, fileName: string) => {
		return downBlobFile(url, query, fileName)
	},
	toUnderline: (str: string) => {
		return toUnderline(str)
	},
	openWindow: (url: string, title: string, w: number, h: number) => {
		return openWindow(url, title, w, h)
	},
	getQueryString: (url: string, paraName: string) => {
		return getQueryString(url, paraName)
	}
};

export function getQueryString(url: string, paraName: string) {
	const arrObj = url.split("?");
	if (arrObj.length > 1) {
		const arrPara = arrObj[1].split("&");
		let arr;
		for (let i = 0; i < arrPara.length; i++) {
			arr = arrPara[i].split("=");
			// eslint-disable-next-line eqeqeq
			if (arr != null && arr[0] == paraName) {
				return arr[1];
			}
		}
		return "";
	} else {
		return "";
	}
}

/**
 * 列表结构转树结构
 * @param data
 * @param id
 * @param parentId
 * @param children
 * @param rootId
 * @returns {*}
 */
export function handleTree(data, id, parentId, children, rootId) {
	id = id || 'id'
	parentId = parentId || 'parentId'
	children = children || 'children'
	rootId = rootId || Math.min.apply(Math, data.map(item => {
		return item[parentId]
	})) || 0
	//对源数据深度克隆
	const cloneData = JSON.parse(JSON.stringify(data))
	//循环所有项
	const treeData = cloneData.filter(father => {
		const branchArr = cloneData.filter(child => {
			//返回每一项的子级数组
			return father[id] === child[parentId]
		})
		branchArr.length > 0 ? father[children] = branchArr : ''
		//返回第一层
		return father[parentId] === rootId
	})
	return treeData !== '' ? treeData : data
}

/**
 *
 * @param str 驼峰转下划线
 * @returns 下划线
 */
export function toUnderline(str: string) {
	return str.replace(/([A-Z])/g, "_$1").toLowerCase()
}


// 统一批量导出
export default other;
