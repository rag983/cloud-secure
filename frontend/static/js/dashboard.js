/**
 * Dashboard Script
 * Main dashboard functionality and data visualization
 */

// Chart instances
let ec2BreakdownChart = null;
let s3BreakdownChart = null;
let riskDistributionChart = null;

// Dashboard state
let dashboardData = null;
let currentTab = 'ec2-assessments';

/**
 * Initialize dashboard
 */
async function initializeDashboard() {
    try {
        console.log('Initializing dashboard...');
        await refreshDashboard();
        
        // Set up auto-refresh every 5 minutes
        setInterval(refreshDashboard, 5 * 60 * 1000);
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showError('Failed to initialize dashboard');
    }
}

/**
 * Refresh all dashboard data
 */
async function refreshDashboard() {
    try {
        // Update last updated time
        updateLastUpdatedTime();

        // Fetch dashboard data
        const response = await apiClient.getDashboardData();
        dashboardData = response;

        // Update all dashboard sections
        updateKPICards();
        updateCharts();
        updateRecommendations();
        updateAssessments();

        console.log('Dashboard refreshed successfully');
    } catch (error) {
        console.error('Dashboard refresh error:', error);
        showError('Failed to refresh dashboard data');
    }
}

/**
 * Update last updated timestamp
 */
function updateLastUpdatedTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('lastUpdated').textContent = `${hours}:${minutes}`;
}

/**
 * Update KPI cards with data
 */
function updateKPICards() {
    const summary = dashboardData.summary;

    // Overall score
    const overallScore = summary.overall?.average_score || 0;
    setScoreCard('overall', Math.round(overallScore), getRiskLevel(overallScore));

    // EC2 score
    const ec2Score = summary.ec2?.average_score || 0;
    document.getElementById('ec2Score').textContent = Math.round(ec2Score);
    document.getElementById('ec2ScoreFill').style.width = `${ec2Score}%`;
    document.getElementById('ec2Count').textContent = `${summary.ec2?.count || 0} instances`;

    // S3 score
    const s3Score = summary.s3?.average_score || 0;
    document.getElementById('s3Score').textContent = Math.round(s3Score);
    document.getElementById('s3ScoreFill').style.width = `${s3Score}%`;
    document.getElementById('s3Count').textContent = `${summary.s3?.count || 0} buckets`;

    // Critical issues count
    const criticalCount = countCriticalIssues();
    document.getElementById('criticalCount').textContent = criticalCount;
}

/**
 * Set score card value
 */
function setScoreCard(cardId, score, riskLevel) {
    document.getElementById(`${cardId}Score`).textContent = Math.round(score);
    document.getElementById(`${cardId}ScoreFill`).style.width = `${score}%`;
    
    if (cardId === 'overall') {
        const riskElement = document.getElementById('overallRiskLevel');
        riskElement.textContent = 'Risk Level: ' + riskLevel;
        riskElement.className = `risk-level ${riskLevel.toLowerCase()}`;
    }
}

/**
 * Get risk level from score
 */
function getRiskLevel(score) {
    if (score >= 80) return 'Low';
    if (score >= 60) return 'Medium';
    if (score >= 40) return 'High';
    return 'Critical';
}

/**
 * Count critical issues
 */
function countCriticalIssues() {
    let count = 0;
    const assessments = [
        ...(dashboardData.ec2?.assessments || []),
        ...(dashboardData.s3?.assessments || [])
    ];

    assessments.forEach(assessment => {
        if (assessment.risk_level === 'Critical') {
            count++;
        }
    });

    return count;
}

/**
 * Update all charts
 */
function updateCharts() {
    updateEC2BreakdownChart();
    updateS3BreakdownChart();
    updateRiskDistributionChart();
}

/**
 * Update EC2 security breakdown chart
 */
function updateEC2BreakdownChart() {
    const assessments = dashboardData.ec2?.assessments || [];
    
    const breakdown = {
        encrypted: 0,
        notEncrypted: 0,
        publicAccess: 0,
        restricted: 0
    };

    assessments.forEach(assessment => {
        if (assessment.ebs_encryption_enabled) breakdown.encrypted++;
        else breakdown.notEncrypted++;

        if (assessment.has_public_ip) breakdown.publicAccess++;
        else breakdown.restricted++;
    });

    const ctx = document.getElementById('ec2BreakdownChart');
    
    if (ec2BreakdownChart) {
        ec2BreakdownChart.destroy();
    }

    ec2BreakdownChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['EBS Encrypted', 'Not Encrypted', 'Public Access', 'Restricted'],
            datasets: [{
                data: [breakdown.encrypted, breakdown.notEncrypted, breakdown.publicAccess, breakdown.restricted],
                backgroundColor: ['#2D8B47', '#D32F2F', '#FF9800', '#146EB4'],
                borderColor: '#1A2332',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#B0B8C1',
                        font: { size: 12 }
                    }
                }
            }
        }
    });
}

/**
 * Update S3 security breakdown chart
 */
function updateS3BreakdownChart() {
    const assessments = dashboardData.s3?.assessments || [];
    
    const breakdown = {
        encrypted: 0,
        notEncrypted: 0,
        publicAccessAllowed: 0,
        secured: 0
    };

    assessments.forEach(assessment => {
        if (assessment.encryption_enabled) breakdown.encrypted++;
        else breakdown.notEncrypted++;

        if (!assessment.public_access_block_disabled) breakdown.secured++;
        else breakdown.publicAccessAllowed++;
    });

    const ctx = document.getElementById('s3BreakdownChart');
    
    if (s3BreakdownChart) {
        s3BreakdownChart.destroy();
    }

    s3BreakdownChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Encryption Enabled', 'No Encryption', 'Public Access Block', 'Fully Secured'],
            datasets: [{
                data: [breakdown.encrypted, breakdown.notEncrypted, breakdown.publicAccessAllowed, breakdown.secured],
                backgroundColor: ['#4ECDC4', '#D32F2F', '#FF9800', '#2D8B47'],
                borderColor: '#1A2332',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#B0B8C1',
                        font: { size: 12 }
                    }
                }
            }
        }
    });
}

/**
 * Update risk distribution chart
 */
function updateRiskDistributionChart() {
    const assessments = [
        ...(dashboardData.ec2?.assessments || []),
        ...(dashboardData.s3?.assessments || [])
    ];

    const riskCounts = {
        Low: 0,
        Medium: 0,
        High: 0,
        Critical: 0
    };

    assessments.forEach(assessment => {
        const risk = assessment.risk_level || 'Unknown';
        if (risk in riskCounts) {
            riskCounts[risk]++;
        }
    });

    const ctx = document.getElementById('riskDistributionChart');
    
    if (riskDistributionChart) {
        riskDistributionChart.destroy();
    }

    riskDistributionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Low', 'Medium', 'High', 'Critical'],
            datasets: [{
                label: 'Resources by Risk Level',
                data: [riskCounts.Low, riskCounts.Medium, riskCounts.High, riskCounts.Critical],
                backgroundColor: ['#2D8B47', '#FFC107', '#FF9800', '#D32F2F'],
                borderColor: '#0B121D',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'x',
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#B0B8C1'
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        color: '#B0B8C1',
                        beginAtZero: true
                    },
                    grid: {
                        color: '#253549'
                    }
                },
                x: {
                    ticks: {
                        color: '#B0B8C1'
                    },
                    grid: {
                        color: '#253549'
                    }
                }
            }
        }
    });
}

/**
 * Update recommendations section
 */
function updateRecommendations() {
    const recommendations = dashboardData.recommendations || [];
    const container = document.getElementById('recommendationsContainer');

    if (recommendations.length === 0) {
        container.innerHTML = '<div class="loading">No critical recommendations at this time</div>';
        return;
    }

    container.innerHTML = recommendations.map(rec => createRecommendationCard(rec)).join('');
}

/**
 * Create recommendation card HTML
 */
function createRecommendationCard(recommendation) {
    const priority = recommendation.priority || 'MEDIUM';
    
    return `
        <div class="recommendation-card ${priority.toLowerCase()}">
            <div class="priority-badge ${priority.toLowerCase()}">
                ${priority}
            </div>
            <h4>${recommendation.title || 'Security Recommendation'}</h4>
            <p>${recommendation.description || 'Review security configuration'}</p>
            <div class="resource-info">
                <strong>Issue:</strong> ${recommendation.issue || 'General security concern'}
            </div>
            ${recommendation.resource_type ? `
                <div class="resource-info">
                    <strong>Type:</strong> ${recommendation.resource_type}
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Update assessments section
 */
function updateAssessments() {
    const ec2Assessments = dashboardData.ec2?.assessments || [];
    const s3Assessments = dashboardData.s3?.assessments || [];

    updateAssessmentList('ec2AssessmentList', ec2Assessments, 'EC2');
    updateAssessmentList('s3AssessmentList', s3Assessments, 'S3');
}

/**
 * Update assessment list
 */
function updateAssessmentList(elementId, assessments, type) {
    const container = document.getElementById(elementId);

    if (assessments.length === 0) {
        container.innerHTML = `<div class="loading">No ${type} assessments found</div>`;
        return;
    }

    container.innerHTML = assessments.map(assessment => 
        createAssessmentCard(assessment, type)
    ).join('');
}

/**
 * Create assessment card HTML
 */
function createAssessmentCard(assessment, type) {
    const score = assessment.security_score || 0;
    const riskLevel = assessment.risk_level || 'Unknown';
    const name = assessment.instance_name || assessment.bucket_name || 'Unknown';
    const state = assessment.state || 'unknown';
    const issues = assessment.issues || [];

    return `
        <div class="assessment-item">
            <h4>${name}</h4>
            <p class="resource-name">
                ${type === 'EC2' ? type + ' Instance' : 'S3 Bucket'}
                ${type === 'EC2' ? `<span class="status-badge ${state}">${state}</span>` : ''}
            </p>
            <div class="assessment-score">
                <div class="assessment-score-value" style="color: ${getScoreColor(score)}">
                    ${Math.round(score)}
                </div>
                <div class="assessment-score-bar">
                    <div class="score-bar">
                        <div class="score-fill" style="width: ${score}%; background: ${getScoreGradient(score)}"></div>
                    </div>
                    <p style="font-size: 0.8rem; color: #B0B8C1; margin-top: 0.25rem;">
                        Risk: <strong style="color: ${getRiskColor(riskLevel)}">${riskLevel}</strong>
                    </p>
                </div>
            </div>
            ${issues.length > 0 ? `
                <div class="issues-list">
                    ${issues.slice(0, 3).map(issue => `<li>${issue}</li>`).join('')}
                    ${issues.length > 3 ? `<li>... and ${issues.length - 3} more issues</li>` : ''}
                </div>
            ` : '<p style="color: #2D8B47; font-size: 0.9rem;">✓ No issues found</p>'}
        </div>
    `;
}

/**
 * Get color for score
 */
function getScoreColor(score) {
    if (score >= 80) return '#2D8B47';
    if (score >= 60) return '#FFC107';
    if (score >= 40) return '#FF9800';
    return '#D32F2F';
}

/**
 * Get color for risk level
 */
function getRiskColor(riskLevel) {
    const colors = {
        'Low': '#2D8B47',
        'Medium': '#FFC107',
        'High': '#FF9800',
        'Critical': '#D32F2F'
    };
    return colors[riskLevel] || '#B0B8C1';
}

/**
 * Get gradient for score bar
 */
function getScoreGradient(score) {
    if (score >= 80) return 'linear-gradient(90deg, #2D8B47, #4CAF50)';
    if (score >= 60) return 'linear-gradient(90deg, #FFC107, #FF9800)';
    if (score >= 40) return 'linear-gradient(90deg, #FF9800, #FF6B6B)';
    return 'linear-gradient(90deg, #D32F2F, #F44336)';
}

/**
 * Switch between assessment tabs
 */
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.assessment-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // Add active class to clicked button
    event.target.classList.add('active');
    currentTab = tabName;
}

/**
 * Show error message
 */
function showError(message) {
    console.error(message);
    // Could be enhanced to show a notification/toast
}

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', initializeDashboard);
