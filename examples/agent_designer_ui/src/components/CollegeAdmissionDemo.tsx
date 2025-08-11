import React from 'react';

/**
 * CollegeAdmissionDemo组件 - 高考志愿填报智能分析演示
 * 集成college-admission-demo.html的内容到React组件中
 */
const CollegeAdmissionDemo: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
      <iframe
        src="/college-admission-demo.html"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          margin: 0,
          padding: 0
        }}
        title="高考志愿填报智能分析演示"
      />
    </div>
  );
};

export default CollegeAdmissionDemo;