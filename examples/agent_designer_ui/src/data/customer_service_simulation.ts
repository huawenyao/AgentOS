/**
 * @file This file contains the simulation data and type definitions for the 
 * "Customer Service Request Auto-Processing" workflow example.
 * It is designed to illustrate how different Agents and Capabilities 
 * can be orchestrated to handle a real-world business process.
 */

//==============================================================================
// │ Type Definitions                                                           │
//==============================================================================

/**
 * Represents the initial raw data of a customer service request.
 * This is the primary input that triggers the workflow.
 */
export interface CustomerServiceRequest {
    requestId: string;      // Unique identifier for the request
    timestamp: string;      // ISO 8601 timestamp of when the request was received
    source: 'email' | 'web-form' | 'chat'; // The channel through which the request came
    customerInfo: {
        name: string;
        email: string;
        accountId?: string; // Optional account ID
    };
    requestBody: string;    // The full, unprocessed text of the customer's request
}

/**
 * Represents the output of the Categorization Agent.
 * The request has been analyzed for intent and key entities.
 */
export interface CategorizedRequest extends CustomerServiceRequest {
    analysis: {
        category: 'Billing Inquiry' | 'Technical Support' | 'Sales Question' | 'General Feedback';
        priority: 'High' | 'Medium' | 'Low';
        extractedEntities: {
            productName?: string;
            orderId?: string;
            errorCode?: string;
        };
    };
}

/**
 * Represents the output of the Routing Agent.
 * The request has been assigned to a specific department queue.
 */
export interface RoutedRequest extends CategorizedRequest {
    routing: {
        assignedQueue: 'FinanceDept' | 'SupportLevel1' | 'SalesTeam' | 'CommunityTeam';
        assignedTimestamp: string;
    };
}

/**
 * Represents the final output of the workflow, including the notification sent.
 */
export interface ProcessedRequest extends RoutedRequest {
    notification: {
        status: 'SENT' | 'FAILED';
        sentTimestamp: string;
        confirmationId: string;
    };
}

//==============================================================================
// │ Simulation Data                                                            │
//==============================================================================

/**
 * A sample customer service request representing a technical support issue.
 */
export const sampleTechSupportRequest: CustomerServiceRequest = {
    requestId: 'REQ-12345',
    timestamp: '2023-10-27T10:00:00Z',
    source: 'web-form',
    customerInfo: {
        name: 'Alice Johnson',
        email: 'alice.j@example.com',
        accountId: 'ACC-9876',
    },
    requestBody: 'Hello, my SuperWidget X1 is not turning on. I tried plugging it into different outlets, but the power light remains off. The error code on the back is E-05. Can you help?',
};

/**
 * A sample customer service request representing a billing inquiry.
 */
export const sampleBillingRequest: CustomerServiceRequest = {
    requestId: 'REQ-12346',
    timestamp: '2023-10-27T11:30:00Z',
    source: 'email',
    customerInfo: {
        name: 'Bob Williams',
        email: 'bob.w@example.com',
    },
    requestBody: 'Hi, I believe I was overcharged on my last invoice for order #ORD-54321. Could you please look into this for me?',
};