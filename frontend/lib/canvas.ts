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

const paginated_fetch = async (url: string, init: any, page: number = 1, previous_response: any[] = []): Promise<any[]> => {
    const res = await fetch(`${url}?page=${page}&per_page=${100}`, init);
    const link_headers = parseLinkHeader(res.headers.get('Link'));
    const json = await res.json();
    const all_response = [...previous_response, ...json]
    if ((link_headers !== null) && (typeof link_headers.current !== 'undefined') && (typeof link_headers.last !== 'undefined') && (link_headers.current.url !== link_headers.last.url)) {
        page++;
        console.log(`fetching next page: ${link_headers.next.url}`);
        return paginated_fetch(link_headers.next.url, init, page, all_response);
    } else {
        console.log(`complete: ${page} pages, ${all_response.length} items`);
        return all_response;
    }
}

export const fetch_courses = async (): Promise<any[]> => {
    const json = await paginated_fetch(`${CANVAS_BASE_URL}/courses`, {
        headers: {Authorization: `Bearer ${CANVAS_API_TOKEN}`},
    })
    return json;
}

export const fetch_course = async (course_id: number|string): Promise<any> => {
    // Fetch JSON course.
    const res = await fetch(`${CANVAS_BASE_URL}/courses/${course_id}`, {
        headers: {Authorization: `Bearer ${CANVAS_API_TOKEN}`},
    })
    const json = await res.json();
    return json;
}


export const fetch_users = async (course_id: string): Promise<any[]> => {
    // Fetch JSON list of users.
    const json = await paginated_fetch(`${CANVAS_BASE_URL}/courses/${course_id}/search_users`, {
        headers: {Authorization: `Bearer ${CANVAS_API_TOKEN}`},
    })
    return json;
}