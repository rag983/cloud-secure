/**
 * API Client
 * Handles all API calls to the Lambda backend
 */

class APIClient {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl;
    }

    /**
     * Make HTTP request to API
     * @param {string} endpoint - API endpoint
     * @param {string} method - HTTP method
     * @param {object} data - Request body data
     * @returns {Promise} Response data
     */
    async request(endpoint, method = 'GET', data = null) {
        try {
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            if (data) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(`${this.baseUrl}${endpoint}`, options);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Request Error:', error);
            // If backend isn't available, provide a local mock response for development
            if (endpoint && endpoint.startsWith('/api')) {
                console.warn('Falling back to mock data for', endpoint);
                return mockApiResponse(endpoint, method);
            }
            throw error;
        }
    }

    /**
     * Get dashboard data
     * @returns {Promise} Dashboard data
     */
    async getDashboardData() {
        return this.request('/api/dashboard');
    }

    /**
     * Get all security assessments
     * @returns {Promise} List of assessments
     */
    async getAssessments() {
        return this.request('/api/assessments');
    }

    /**
     * Get security recommendations
     * @returns {Promise} List of recommendations
     */
    async getRecommendations() {
        return this.request('/api/recommendations');
    }

    /**
     * Get security score summary
     * @returns {Promise} Security score summary
     */
    async getSecurityScoreSummary() {
        return this.request('/api/security-score-summary');
    }

    /**
     * Save new security assessment
     * @param {object} assessment - Assessment data
     * @returns {Promise} Save result
     */
    async saveAssessment(assessment) {
        return this.request('/api/assessment', 'POST', assessment);
    }

    /**
     * Save new recommendation
     * @param {object} recommendation - Recommendation data
     * @returns {Promise} Save result
     */
    async saveRecommendation(recommendation) {
        return this.request('/api/recommendation', 'POST', recommendation);
    }
}

// Export API client
const apiClient = new APIClient(
    window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : ''
);

/**
 * Provide simple mock responses for the frontend when no backend is available.
 * This keeps the dashboard functional for local/static preview.
 */
function mockApiResponse(endpoint, method = 'GET') {
    const sample = {
        summary: {
            overall: { average_score: 85 },
            ec2: { average_score: 90, count: 2 },
            s3: { average_score: 80, count: 1 }
        },
        ec2: {
            assessments: [
                {
                    instance_name: 'web-server-01',
                    security_score: 92,
                    risk_level: 'Low',
                    ebs_encryption_enabled: true,
                    has_public_ip: false,
                    state: 'running',
                    issues: []
                },
                {
                    instance_name: 'db-server-01',
                    security_score: 78,
                    risk_level: 'Medium',
                    ebs_encryption_enabled: false,
                    has_public_ip: true,
                    state: 'stopped',
                    issues: ['EBS not encrypted']
                }
            ]
        },
        s3: {
            assessments: [
                {
                    bucket_name: 'my-app-data',
                    security_score: 80,
                    risk_level: 'Medium',
                    encryption_enabled: true,
                    public_access_block_disabled: false,
                    issues: []
                }
            ]
        },
        recommendations: [
            {
                title: 'Enable EBS encryption',
                description: 'EBS volumes should be encrypted to protect data at rest.',
                priority: 'HIGH',
                issue: 'EBS not encrypted',
                resource_type: 'EC2'
            }
        ]
    };

    // Return appropriate slices for common endpoints
    if (endpoint.includes('/api/dashboard')) return sample;
    if (endpoint.includes('/api/assessments')) return { ec2: sample.ec2, s3: sample.s3 };
    if (endpoint.includes('/api/recommendations')) return sample.recommendations;
    if (endpoint.includes('/api/security-score-summary')) return sample.summary;

    // Generic fallback
    return {};
}
