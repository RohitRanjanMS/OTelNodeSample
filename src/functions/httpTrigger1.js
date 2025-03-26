const { app } = require('@azure/functions');
const axios = require('axios');
const { trace, context1 } = require('@opentelemetry/api');

app.http('httpTrigger1', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {

        context.log(`Header traceparent- "${request.headers.get('traceparent')}"`);
        context.log(`Context traceparent- "${context.traceContext.traceParent}"`);
        context.log(`ActiveSpan traceId- "${trace.getActiveSpan()._spanContext.traceId}"`);
        context.log(`ActiveSpan spanId- "${trace.getActiveSpan()._spanContext.spanId}"`);



        try {
            // Make HTTP request to Microsoft
            const response = await axios.get('https://www.microsoft.com/en-us/');
    
            // Return the response
            context.res = {
                status: 200,
                body: response.data,
                headers: {
                    'Content-Type': 'text/html'
                }
            };
        } catch (error) {
            context.log('Error occurred:', error);
    
            // Handle errors
            context.res = {
                status: error.response ? error.response.status : 500,
                body: 'Failed to fetch data from Microsoft'
            };
        }

        // Log the request URL
        context.log(`Http function processed request for url "${request.url}"`);

        const name = request.query.get('name') || await request.text() || 'world';

        return { body: `Hello R, ${name}!` };
    }
});
