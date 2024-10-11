
interface Req {
    status: number;
    statusText: string;
    message: string;
    redirect?: string;
}

// #######################################

// HTTP Success Responses
interface SuccessRequest extends Req {
    error: {};
}

export interface Ok<T> extends SuccessRequest {
    status: 200;
    statusText: 'Success';
    message: 'Successful Request';
    data: T;
}

export interface Created<T> extends SuccessRequest {
    status: 201;
    statusText: 'Created';
    data: T;
}

export interface NoContent extends SuccessRequest {
    status: 204;
    statusText: 'No Content';
    data: {};
}

// #######################################

// HTTP Redirect Responses
interface RedirectRequest {
    error: {};
    data: {};
}

export interface SeeOther extends RedirectRequest {
    status: 303;
    statusText: 'See Other';
    message: 'For redirection on another URI with a GET request';
}

// #######################################

// HTTP Error Responses
interface ErrorRequest extends Req {
    data: {};
    error: {
        [key: string]: string;
    };
}

// ####################

// I. Client Errors
export interface BadRequest extends ErrorRequest {
    status: 400;
    statusText: 'Bad Request';
}

export interface Unauthorized extends Omit<ErrorRequest, 'error'> {
    status: 401;
    statusText: 'Unauthorized';
    error: {
        [key: string]: string[] | string
    }
}

export interface NotFound extends ErrorRequest {
    status: 404;
    statusText: 'Not Found';
}

// ####################

// II. Server Errors
export interface InternalServerError extends ErrorRequest {
    status: 500;
    statusText: 'Internal Server Error';
}
