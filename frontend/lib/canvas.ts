import getConfig from 'next/config';
const { serverRuntimeConfig, publicRuntimeConfig } = getConfig();
const API_URI = serverRuntimeConfig.API_URI || publicRuntimeConfig.API_URI;
const CANVAS_API_TOKEN = serverRuntimeConfig.CANVAS_API_TOKEN || publicRuntimeConfig.CANVAS_API_TOKEN;
console.log(`serverRuntimeConfig: ${JSON.stringify(serverRuntimeConfig)}`)
console.log(`publicRuntimeConfig: ${JSON.stringify(publicRuntimeConfig)}`)
console.log(`API_URI: ${JSON.stringify(API_URI)}`)
console.log(`CANVAS_API_TOKEN=${CANVAS_API_TOKEN}`)

const CANVAS_BASE_URL = serverRuntimeConfig.CANVAS_BASE_URL || publicRuntimeConfig.CANVAS_BASE_URL;
console.log(`CANVAS_BASE_URL="${CANVAS_BASE_URL}"`)

import parseLinkHeader from 'parse-link-header';

/**
 * Helper to flatten an object (containing REST API query parameters)
 * into a format that is readable by `URLSearchParameters()`.
 * @param kwargs Object with keys and values.
 * @returns Array of two-element arrays of type [string, any].
 */
const flatten_kwargs = (kwargs: object): [string, any][] => {
    var l: [string, any][] = [];
    Object.entries(kwargs).forEach(([key, value]) => {
        // Array items.
        if (Array.isArray(value)) {
            l.push(...(<[string, any][]> value.map(v => [`${key}[]`, v]))); // Cast to type.
        }
        else if (typeof value === 'object') {
            l.push(...flatten_kwargs(value))
        }
        // Numbers, strings, etc.
        else {
            l.push([key, value]);
        }
    });
    return l;
}

/**
 * Fetch from a paginated REST API endpoint.
 * @param url URL to fetch.
 * @param init Fetch init object (passed directly to `fetch()`).
 * @param page Page number (defaults to `1`).
 * @param previous_response The previous response list.
 * @returns Promise to list of objects.
 */
const paginated_fetch = async (
    url: string,
    init: any,
    page: number = 1,
    per_page: number = 100,
    previous_response: any[] = [],
    ): Promise<any[]> => {
    const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}page=${page}&per_page=${per_page}`, init);
    const link_headers = parseLinkHeader(res.headers.get('Link'));
    const json = await res.json();
    const all_response = [...previous_response, ...json]
    if ((link_headers !== null) && (typeof link_headers.current !== 'undefined') && (typeof link_headers.next !== 'undefined')) {
        page++;
        console.log(`fetching next page: ${link_headers.next.url}`);
        return paginated_fetch(url, init, page, per_page, all_response);
    } else {
        console.log(`link_headers: ${JSON.stringify(link_headers)}`);
        console.log(`complete: ${page} pages, ${all_response.length} items`);
        return all_response;
    }
}

/**
 * Get list of courses.
 * @returns Promise to list of course objects.
 */
export const fetch_courses = async (): Promise<any[]> => {
    const json = await paginated_fetch(`${CANVAS_BASE_URL}/courses`, {
        headers: {Authorization: `Bearer ${CANVAS_API_TOKEN}`},
    })
    return json;
}


/**
 * Get course object by ID.
 * @param course_id Course ID number.
 * @returns Promise to course object.
 */
export const fetch_course = async (course_id: number|string): Promise<any> => {
    // Fetch JSON course.
    const res = await fetch(`${CANVAS_BASE_URL}/courses/${course_id}`, {
        headers: {Authorization: `Bearer ${CANVAS_API_TOKEN}`},
    })
    const json = await res.json();
    return json;
}


/**
 * Get list of user objects.
 * For query arguments see: https://canvas.instructure.com/doc/api/courses.html#method.courses.search_users
 * @param course_id Course ID number.
 * @param kwargs Canvas API query arguments.
 * @returns Promise to list of user objects.
 */
export const fetch_users = async (course_id: string, kwargs?: object): Promise<any[]> => {

    // Create base URL.
    var url = `${CANVAS_BASE_URL}/courses/${course_id}/search_users`

    // Add query parameters.
    if (typeof kwargs !== 'undefined') {
        const params = new URLSearchParams(flatten_kwargs(kwargs));
        url = `${url}?${params}`;
    }

    // Fetch JSON list of users.
    const json = await paginated_fetch(url, {
        headers: {Authorization: `Bearer ${CANVAS_API_TOKEN}`},
    })
    return json;
}


export const fetch_assignments = async (
    course_id: number|string,
    kwargs?: object,
    ): Promise<any[]> => {

    // Build URL
    var url = `${CANVAS_BASE_URL}/courses/${course_id}/assignments`

    // Add query parameters.
    if (typeof kwargs !== 'undefined') {
        const params = new URLSearchParams(flatten_kwargs(kwargs));
        url = `${url}?${params}`;
    }

    // Fetch response.
    const json = await paginated_fetch(url, {
        headers: {Authorization: `Bearer ${CANVAS_API_TOKEN}`},
    })
    return json;
}


export const fetch_assignment = async (
    course_id: number|string,
    assignment_id: number|string,
    kwargs?: object,
    ): Promise<any> => {

    // Build URL
    var url = `${CANVAS_BASE_URL}/courses/${course_id}/assignments/${assignment_id}`

    // Add query parameters.
    if (typeof kwargs !== 'undefined') {
        const params = new URLSearchParams(flatten_kwargs(kwargs));
        url = `${url}?${params}`;
    }

    // Fetch response.
    const res = await fetch(url, {
        headers: {Authorization: `Bearer ${CANVAS_API_TOKEN}`},
    })
    const json = await res.json();
    return json;
}