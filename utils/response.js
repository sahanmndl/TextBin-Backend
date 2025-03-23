export const successAPIResponse = (body = null) => {
    return {body: body, success: true}
}

export const errorAPIResponse = (error = null) => {
    return {error: error, success: false}
}