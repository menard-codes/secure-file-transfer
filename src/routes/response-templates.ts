import type {
    BadRequest,
    Unauthorized,
    NotFound,
    InternalServerError,
    Ok,
    Created,
    NoContent,
    SeeOther
} from "~/response.schema.ts"

export class SuccessResponseTemplates {
    public static okResponseTemplate<T>(data: T): Ok<T> {
        return {
            status: 200,
            statusText: "Success",
            message: "Successful Request",
            data,
            error: {}
        }
    }

    public static createdTemplate<T>(message: string, data: T): Created<T> {
        return {
            status: 201,
            statusText: "Created",
            message,
            data,
            error: {}
        }
    }

    public static noContent(message: string): NoContent {
        return {
            status: 204,
            statusText: "No Content",
            message,
            data: {},
            error: {}
        }
    }
}

export class RedirectResponseTemplates {
    public static seeOther(): SeeOther {
        return {
            status: 303,
            statusText: "See Other",
            message: "For redirection on another URI with a GET request",
            data: {},
            error: {}
        }
    }
}

export class ErrorResponseTemplates {
    public static badRequestTemplate(message: string, error: { [key: string]: string }): BadRequest {
        return {
            status: 400,
            statusText: "Bad Request",
            message,
            error,
            data: {}
        }
    }

    public static unauthorizedTemplate(message: string, error: { [key: string]: string[] | string }): Unauthorized {
        return {
            status: 401,
            statusText: "Unauthorized",
            message,
            error,
            data: {}
        }
    }

    public static notFoundTemplate(message: string, error: { [key: string]: string }): NotFound {
        return {
            status: 404,
            statusText: "Not Found",
            message,
            error,
            data: {}
        }
    }

    public static internalServerError(): InternalServerError {
        return {
            status: 500,
            statusText: "Internal Server Error",
            message: "Something went wrong... Try finding support",
            error: {},
            data: {}
        }
    }
}
