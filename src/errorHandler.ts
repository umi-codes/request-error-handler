import {notification} from "antd";
import {ResponseError} from "umi-request";

export type errorCodeHandleFun = (error: ResponseError) => void;

export type errorHandlerConfig = {
    loginURL?: string;
    codeHandleFun?: { [key: number]: errorCodeHandleFun };
}

const codeMessage: { [key: number]: string } = {
    200: '服务器成功返回请求的数据。',
    201: '新建或修改数据成功。',
    202: '一个请求已经进入后台排队（异步任务）。',
    204: '删除数据成功。',
    400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
    401: '用户没有权限（令牌、用户名、密码错误）。',
    403: '用户得到授权，但是访问是被禁止的。',
    404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
    405: '请求方法不被允许。',
    406: '请求的格式不可得。',
    410: '请求的资源被永久删除，且不会再得到的。',
    422: '当创建一个对象时，发生一个验证错误。',
    500: '服务器发生错误，请检查服务器。',
    502: '网关错误。',
    503: '服务不可用，服务器暂时过载或维护。',
    504: '网关超时。',
};

const handleFor401 = (loginUrl: string) => {
    notification.error({
        duration: 3,
        message: `拒绝访问`,
        description: "用户没有权限或登录态已过期，系统将在3秒后自动跳转至登录页...",
        onClose: () => {
            location.href = loginUrl;
        },
    });
}

const handleFor403 = () => {
    notification.error({
        message: `拒绝访问`,
        description: `用户得到授权，但是访问是被禁止的`,
    });

}

const handleOther = (error: ResponseError) => {
    const {response} = error;
    const errorText = codeMessage[response.status] || response.statusText;
    const {status, url} = response;
    notification.error({
        duration: 5,
        message: `请求错误 ${status}: ${url}`,
        description: error.data?.message ? error.data.message : errorText,
    });
}

const constructor = (config: errorHandlerConfig): (error: ResponseError) => void => {
    const {loginURL, codeHandleFun} = config;

    let errorHandler: (error: ResponseError) => void = (error) => {
        const {response} = error;

        if (response && response.status) {
            switch (response.status) {
                case 401:
                    codeHandleFun?.[401] ? codeHandleFun?.[401](error) : handleFor401(loginURL);
                    break;
                case 403:
                    codeHandleFun?.[403] ? codeHandleFun?.[403](error) : handleFor403();
                    break;
                default:
                    codeHandleFun?.[response.status] ? codeHandleFun?.[response.status](error) : handleOther(error);
            }
        }

        if (!response) {
            notification.error({
                description: '您的网络发生异常，无法连接服务器',
                message: '网络异常',
            });
        }
        throw error;
    }
    return errorHandler;
}


export default constructor;