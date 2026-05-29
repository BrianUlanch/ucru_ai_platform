import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart3, 
  Box, 
  TrendingDown, 
  Send, 
  Kanban, 
  Plug, 
  UploadCloud, 
  Trash2, 
  Search, 
  AlertCircle,
  CheckCircle2,
  Cpu,
  Globe,
  DollarSign
} from 'lucide-react';

// --- DATA PARSING UTILITY ---
// A robust in-browser CSV parser to handle quotes and commas without external libraries
const parseCSV = (text) => {
  let p = '', row = [''], ret = [row], i = 0, r = 0, s = !0, l;
  for (l of text) {
      if ('"' === l) {
          if (s && l === p) row[i] += l;
          s = !s;
      } else if (',' === l && s) l = row[++i] = '';
      else if ('\n' === l && s) {
          if ('\r' === p) row[i] = row[i].slice(0, -1);
          row = ret[++r] = [l = '']; i = 0;
      } else row[i] += l;
      p = l;
  }
  if (ret[ret.length - 1][0] === '') ret.pop();
  
  const headers = ret[0].map(h => h.trim());
  const data = ret.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, j) => { 
        let val = row[j] ? row[j].trim() : '';
        // Convert known numeric fields
        if (['unit_cost', 'line_total', 'qty_ordered', 'qty_received', 'supplier_on_time_rate', 'supplier_defect_rate_pct'].includes(h)) {
          val = parseFloat(val) || 0;
        }
        obj[h] = val; 
      });
      return obj;
  });
  return data;
};

// --- MODULE 1: OPPORTUNITY MINING (SOW 1) ---
const UcruOpportunityMining = ({ data }) => {
  const insights = useMemo(() => {
    if (!data.length) return { totalSpend: 0, opportunities: [] };
    
    let totalSpend = 0;
    const skuMap = {};

    data.forEach(row => {
      totalSpend += row.line_total;
      if (!skuMap[row.sku_id]) {
        skuMap[row.sku_id] = { id: row.sku_id, desc: row.sku_description, costs: [], suppliers: new Set() };
      }
      skuMap[row.sku_id].costs.push(row.unit_cost);
      skuMap[row.sku_id].suppliers.add(row.supplier_name);
    });

    // Calculate variance for opportunities
    const opportunities = Object.values(skuMap).map(sku => {
      const max = Math.max(...sku.costs);
      const min = Math.min(...sku.costs);
      const variance = max - min;
      const potentialSavings = variance * (sku.costs.length * 100); // Mock volume multiplier
      return { ...sku, max, min, variance, potentialSavings, supplierCount: sku.suppliers.size };
    }).filter(sku => sku.variance > 0)
      .sort((a, b) => b.potentialSavings - a.potentialSavings)
      .slice(0, 10); // Top 10

    return { totalSpend, opportunities };
  }, [data]);

  if (!data.length) return <EmptyState />;

  return (
    <div className="p-6 space-y-6 fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">AI-Powered Opportunity Mining</h2>
        <p className="text-slate-500">Continuous analytics engine integrating and normalizing spend data.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><DollarSign /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Spend Analyzed</p>
            <p className="text-2xl font-bold text-slate-800">${insights.totalSpend.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg"><TrendingDown /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Identified Opportunities</p>
            <p className="text-2xl font-bold text-slate-800">{insights.opportunities.length} SKUs</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg"><Box /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Spend Coverage</p>
            <p className="text-2xl font-bold text-slate-800">100%</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-800">Top Price Variance Opportunities</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">SKU</th>
                <th className="px-6 py-3 font-medium">Description</th>
                <th className="px-6 py-3 font-medium">Min Price</th>
                <th className="px-6 py-3 font-medium">Max Price</th>
                <th className="px-6 py-3 font-medium">Suppliers</th>
                <th className="px-6 py-3 font-medium">Potential Value</th>
                <th className="px-6 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {insights.opportunities.map((opp, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-blue-600">{opp.id}</td>
                  <td className="px-6 py-4 truncate max-w-xs">{opp.desc}</td>
                  <td className="px-6 py-4 text-emerald-600">${opp.min.toFixed(2)}</td>
                  <td className="px-6 py-4 text-red-600">${opp.max.toFixed(2)}</td>
                  <td className="px-6 py-4">{opp.supplierCount}</td>
                  <td className="px-6 py-4 font-semibold">${opp.potentialSavings.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <button className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-md transition-colors">
                      Add to Pipeline
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- MODULE 2: DIGITAL TWIN ENABLEMENT (SOW 2) ---
const UcruDigitalTwin = ({ data }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSku, setSelectedSku] = useState(null);

  const skus = useMemo(() => {
    const unique = [...new Set(data.map(d => d.sku_id))].filter(Boolean);
    if (!selectedSku && unique.length > 0) setSelectedSku(unique[0]);
    return unique;
  }, [data]);

  const partData = useMemo(() => {
    if (!selectedSku) return null;
    const history = data.filter(d => d.sku_id === selectedSku);
    const latest = history.sort((a, b) => new Date(b.po_date) - new Date(a.po_date))[0] || {};
    return { history, latest };
  }, [selectedSku, data]);

  if (!data.length) return <EmptyState />;

  return (
    <div className="p-6 space-y-6 fade-in h-full flex flex-col">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Part-Level Digital Twin Enablement</h2>
        <p className="text-slate-500">Integrated part data, history, and market intelligence.</p>
      </div>

      <div className="flex space-x-4 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
          <select 
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
            value={selectedSku || ''}
            onChange={(e) => setSelectedSku(e.target.value)}
          >
            {skus.map(sku => <option key={sku} value={sku}>{sku}</option>)}
          </select>
        </div>
        <button className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition flex items-center">
          <Cpu className="w-4 h-4 mr-2" /> AI Should-Cost Analysis
        </button>
      </div>

      {partData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-lg border-b pb-2 mb-4">Part Specifications</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">SKU ID</span><span className="font-medium">{partData.latest.sku_id}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Description</span><span className="font-medium text-right w-1/2">{partData.latest.sku_description}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Category</span><span className="font-medium">{partData.latest.category}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">UOM</span><span className="font-medium">{partData.latest.uom}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Hazmat</span><span className={`font-medium ${partData.latest.hazmat_flag === 'Y' ? 'text-red-500' : 'text-emerald-500'}`}>{partData.latest.hazmat_flag === 'Y' ? 'Yes' : 'No'}</span></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-lg border-b pb-2 mb-4 flex items-center"><Globe className="w-5 h-5 mr-2 text-blue-500"/> Market Intelligence</h3>
              <div className="space-y-4 text-sm">
                <div className="p-3 bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
                  <strong>Regulatory Update:</strong> New EU carbon import tariffs may affect {partData.latest.category} landed costs by Q4.
                </div>
                <div className="p-3 bg-blue-50 text-blue-800 rounded-lg border border-blue-200">
                  <strong>Trend:</strong> Raw material index for this category is down 2.4% MoM. Favorable negotiation conditions.
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
             <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800">Purchasing History & Benchmarks</h3>
              <button className="text-sm bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-md flex items-center">
                <Send className="w-4 h-4 mr-2" /> One-Click RFQ
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="space-y-4">
                {partData.history.map((tx, i) => (
                  <div key={i} className="flex justify-between items-center p-4 border border-slate-100 rounded-lg hover:bg-slate-50">
                    <div>
                      <p className="font-medium text-slate-800">{tx.supplier_name}</p>
                      <p className="text-xs text-slate-500">PO: {tx.po_number} • Date: {tx.po_date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-800">${tx.unit_cost.toFixed(2)} <span className="text-xs font-normal text-slate-500">/ {tx.uom}</span></p>
                      <p className="text-xs text-slate-500">Qty: {tx.qty_ordered}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- MODULE 3: BENCHMARKING (SOW 3) ---
const UcruBenchmarking = ({ data }) => {
  if (!data.length) return <EmptyState />;

  const categoryStats = useMemo(() => {
    const categories = {};
    data.forEach(d => {
      if(!categories[d.category]) categories[d.category] = { spend: 0, items: new Set() };
      categories[d.category].spend += d.line_total;
      categories[d.category].items.add(d.sku_id);
    });
    return Object.entries(categories).sort((a,b) => b[1].spend - a[1].spend).slice(0, 5);
  }, [data]);

  return (
    <div className="p-6 space-y-6 fade-in">
       <div>
        <h2 className="text-2xl font-bold text-slate-800">AI-Enhanced Should-Cost & Benchmarking</h2>
        <p className="text-slate-500">Fact-based negotiations using dynamic benchmarks.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <h3 className="font-bold text-lg mb-4">Target Pricing Models vs Actual</h3>
           <div className="space-y-6">
             {categoryStats.map(([cat, stats], i) => {
               // Mock target variance
               const variance = Math.floor(Math.random() * 15) + 5; 
               const targetMet = i % 2 === 0;
               return (
                 <div key={i}>
                   <div className="flex justify-between text-sm mb-1">
                     <span className="font-medium">{cat}</span>
                     <span className={targetMet ? 'text-emerald-600' : 'text-red-600'}>
                       {targetMet ? '-' : '+'}{variance}% vs Target
                     </span>
                   </div>
                   <div className="w-full bg-slate-200 rounded-full h-2.5">
                     <div className={`h-2.5 rounded-full ${targetMet ? 'bg-emerald-500' : 'bg-red-500'}`} style={{width: `${100 - (targetMet ? variance : -variance)}%`}}></div>
                   </div>
                 </div>
               )
             })}
           </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-lg mb-4">Regional Competitiveness</h3>
          <div className="relative h-64 border border-slate-100 rounded-lg bg-slate-50 flex items-center justify-center flex-col text-slate-500">
             <Globe className="w-12 h-12 mb-3 text-blue-200" />
             <p className="text-sm">Regional mapping visualization active during live Sourcing events.</p>
             <p className="text-xs mt-2 text-slate-400">(Connecting to Supplier Geography APIs...)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MODULE 4: RFQ EXECUTION (SOW 4) ---
const UcruRFQExecution = ({ data }) => {
  if (!data.length) return <EmptyState />;

  const recommendedSuppliers = useMemo(() => {
    const supMap = {};
    data.forEach(d => {
      if(!supMap[d.supplier_id]) {
        supMap[d.supplier_id] = {
          id: d.supplier_id,
          name: d.supplier_name,
          tier: d.supplier_tier,
          country: d.supplier_country,
          onTime: [],
          defect: []
        };
      }
      supMap[d.supplier_id].onTime.push(d.supplier_on_time_rate);
      supMap[d.supplier_id].defect.push(d.supplier_defect_rate_pct);
    });

    return Object.values(supMap).map(s => {
      const avgOnTime = s.onTime.reduce((a,b)=>a+b,0) / s.onTime.length;
      const avgDefect = s.defect.reduce((a,b)=>a+b,0) / s.defect.length;
      // Algorithm score: higher on-time is good, lower defect is good.
      const aiScore = (avgOnTime * 100) - (avgDefect * 10);
      return { ...s, avgOnTime, avgDefect, aiScore };
    }).sort((a,b) => b.aiScore - a.aiScore);
  }, [data]);

  return (
    <div className="p-6 space-y-6 fade-in">
       <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">AI-Enhanced RFQ Execution</h2>
          <p className="text-slate-500">Automated, intelligence-driven supplier recommendations and bidding.</p>
        </div>
        <button className="bg-orange-500 text-white px-5 py-2.5 rounded-lg hover:bg-orange-600 transition font-medium shadow-sm flex items-center">
          <Box className="w-5 h-5 mr-2" /> Create RFQ Pack
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
         <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">AI Supplier Recommendation Engine</h3>
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">Scoring Based on Quality & Speed</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-slate-500 border-b">
              <tr>
                <th className="px-6 py-3 font-medium">Supplier</th>
                <th className="px-6 py-3 font-medium">Tier / Location</th>
                <th className="px-6 py-3 font-medium">Avg On-Time Del.</th>
                <th className="px-6 py-3 font-medium">Avg Defect Rate</th>
                <th className="px-6 py-3 font-medium">AI Match Score</th>
                <th className="px-6 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recommendedSuppliers.map((sup, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-800">{sup.name}</p>
                    <p className="text-xs text-slate-400">{sup.id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600 mr-2">{sup.tier}</span>
                    <span className="text-slate-500 text-xs">{sup.country}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className={`font-medium mr-2 ${sup.avgOnTime >= 0.9 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {(sup.avgOnTime * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <span className={`font-medium ${sup.avgDefect <= 1.0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {sup.avgDefect.toFixed(2)}%
                      </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1">
                      {[1,2,3,4,5].map(star => (
                        <svg key={star} className={`w-4 h-4 ${star <= (sup.aiScore > 85 ? 5 : sup.aiScore > 75 ? 4 : 3) ? 'text-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-sm border border-slate-300 hover:border-blue-500 hover:text-blue-600 bg-white px-3 py-1.5 rounded-md transition-colors">
                      Select for Bid
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- MODULE 5: PIPELINE & EXECUTION (SOW 5) ---
const UcruPipeline = () => {
  // Static mock demonstrating the Opportunity-to-Execution flow
  const stages = [
    { title: "Opportunity Identified", count: 12, value: "$1.2M", color: "border-l-blue-500" },
    { title: "Sourcing Readiness", count: 5, value: "$600K", color: "border-l-indigo-500" },
    { title: "Active Negotiation", count: 3, value: "$350K", color: "border-l-amber-500" },
    { title: "Value Realized (YTD)", count: 8, value: "$850K", color: "border-l-emerald-500" },
  ];

  return (
    <div className="p-6 space-y-6 fade-in h-full">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Opportunity-to-Execution Acceleration</h2>
        <p className="text-slate-500">Structured pipeline aligning insights to financial value realization.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[calc(100%-80px)]">
        {stages.map((stage, idx) => (
          <div key={idx} className={`bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col`}>
            <div className={`border-l-4 ${stage.color} pl-3 mb-4`}>
              <h3 className="font-semibold text-slate-700">{stage.title}</h3>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs bg-white border border-slate-200 px-2 py-0.5 rounded-full font-medium text-slate-500">{stage.count} items</span>
                <span className="text-sm font-bold text-slate-800">{stage.value}</span>
              </div>
            </div>
            
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {/* Mock Cards */}
              {[...Array(idx === 3 ? 2 : 3)].map((_, i) => (
                <div key={i} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm cursor-grab hover:border-blue-300 transition-colors">
                  <p className="text-xs font-medium text-blue-600 mb-1">OPT-{1000 + idx*10 + i}</p>
                  <p className="text-sm text-slate-700 font-medium leading-tight mb-2">Consolidate Tier 2 Suppliers for Category {String.fromCharCode(65+i)}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Est. Savings</span>
                    <span className="text-xs font-bold text-emerald-600">${Math.floor(Math.random() * 50 + 10)}K</span>
                  </div>
                </div>
              ))}
              <button className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-400 text-sm font-medium hover:border-blue-400 hover:text-blue-500 transition-colors">
                + Add Item
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- MODULE 6: API GATEWAY (Extensibility) ---
const UcruApiGateway = () => {
  return (
    <div className="p-6 space-y-6 fade-in max-w-4xl">
       <div>
        <h2 className="text-2xl font-bold text-slate-800">Ucru API & Integration Gateway</h2>
        <p className="text-slate-500">Connect to external ERPs, Data Lakes, and third-party tools.</p>
      </div>

      <div className="space-y-4">
        {[
          { name: "SAP Ariba (ERP)", status: "connected", lastSync: "10 mins ago", icon: <Globe className="w-6 h-6 text-blue-600"/> },
          { name: "Coupa Spend Management", status: "disconnected", lastSync: "-", icon: <Box className="w-6 h-6 text-purple-600"/> },
          { name: "Supplier Risk DB (Third-Party)", status: "connected", lastSync: "1 hr ago", icon: <AlertCircle className="w-6 h-6 text-amber-600"/> },
        ].map((api, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                {api.icon}
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">{api.name}</h3>
                <p className="text-sm text-slate-500">Last Sync: {api.lastSync}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {api.status === 'connected' ? (
                <span className="flex items-center text-emerald-600 text-sm font-medium bg-emerald-50 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Connected
                </span>
              ) : (
                <span className="flex items-center text-slate-500 text-sm font-medium bg-slate-100 px-3 py-1 rounded-full">
                  Disconnected
                </span>
              )}
              <button className={`px-4 py-2 text-sm font-medium rounded-lg border ${api.status === 'connected' ? 'border-slate-300 text-slate-600 hover:bg-slate-50' : 'border-blue-600 text-blue-600 hover:bg-blue-50'} transition-colors`}>
                {api.status === 'connected' ? 'Configure' : 'Connect'}
              </button>
            </div>
          </div>
        ))}

        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-8 text-center flex flex-col items-center justify-center">
          <Plug className="w-10 h-10 text-slate-400 mb-3" />
          <h3 className="font-semibold text-slate-700">Add New Integration</h3>
          <p className="text-sm text-slate-500 max-w-md mt-1 mb-4">Paste your API keys or OAuth credentials to establish a new secure pipeline for AI analysis.</p>
          <button className="bg-orange-500 text-white px-5 py-2.5 rounded-lg hover:bg-orange-600 transition font-medium">
            Developer Console
          </button>
        </div>
      </div>
    </div>
  );
};

// --- HELPER COMPONENTS ---
const EmptyState = () => (
  <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center">
    <div className="bg-slate-100 p-6 rounded-full mb-4">
      <UploadCloud className="w-12 h-12 text-slate-400" />
    </div>
    <h3 className="text-xl font-semibold text-slate-700 mb-2">No Data Available</h3>
    <p className="max-w-md">Please upload your `parts transactions.csv` file using the button in the top right to populate this module.</p>
  </div>
);

// --- MAIN APPLICATION CONTAINER ---
export default function UcruApp() {
  const [data, setData] = useState([]);
  const [activeTab, setActiveTab] = useState('mining');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target.result;
        const parsed = parseCSV(text);
        setData(parsed);
      };
      reader.readAsText(file);
    }
  };

  const clearData = () => {
    if(window.confirm("Are you sure you want to delete all uploaded data?")) {
      setData([]);
    }
  };

  const navItems = [
    { id: 'mining', label: 'Opportunity Mining', icon: BarChart3 },
    { id: 'twin', label: 'Part Digital Twin', icon: Box },
    { id: 'benchmarking', label: 'Benchmarking', icon: TrendingDown },
    { id: 'rfq', label: 'RFQ Execution', icon: Send },
    { id: 'pipeline', label: 'Value Pipeline', icon: Kanban },
    { id: 'api', label: 'API Gateway', icon: Plug },
  ];

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex text-slate-900">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-blue-900 text-white flex flex-col shadow-xl z-20">
        <div className="p-6">
          <div className="bg-white px-3 py-2 rounded-lg inline-block shadow-sm mb-2">
            <img 
              src="./image_c9cdb4.png" 
              alt="TheUcru Logo" 
              className="h-7 w-auto object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
            <div style={{ display: 'none' }} className="items-center font-black text-2xl tracking-tight">
              <span className="text-blue-900">The</span><span className="text-orange-500">Ucru</span>
            </div>
          </div>
          <p className="text-blue-200 text-xs mt-1 font-medium tracking-wide uppercase">Purchasing Analytics</p>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                activeTab === item.id 
                  ? 'bg-orange-500 text-white shadow-md' 
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-blue-800 bg-blue-950/30">
          <div className="flex items-center space-x-3">
             <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-sm font-bold shadow-inner">AU</div>
             <div>
               <p className="text-sm font-semibold text-white">Audriana U.</p>
               <p className="text-xs text-blue-300">Grand Rapids, MI</p>
             </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header / Data Manager */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center text-sm">
            <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-medium mr-3">System Online</span>
            <span className="text-slate-500">Rows loaded: <strong className="text-slate-800">{data.length}</strong></span>
          </div>

          {/* UcruDataManager logic inline for header */}
          <div className="flex items-center space-x-3">
            {data.length > 0 && (
              <button 
                onClick={clearData}
                className="flex items-center text-sm font-medium text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete All Data
              </button>
            )}
            
            <label className="flex items-center text-sm font-medium bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg cursor-pointer transition shadow-sm">
              <UploadCloud className="w-4 h-4 mr-2" />
              <span>Upload CSV</span>
              <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </header>

        {/* Dynamic Module Rendering */}
        <main className="flex-1 overflow-y-auto bg-slate-50 relative">
          {activeTab === 'mining' && <UcruOpportunityMining data={data} />}
          {activeTab === 'twin' && <UcruDigitalTwin data={data} />}
          {activeTab === 'benchmarking' && <UcruBenchmarking data={data} />}
          {activeTab === 'rfq' && <UcruRFQExecution data={data} />}
          {activeTab === 'pipeline' && <UcruPipeline />}
          {activeTab === 'api' && <UcruApiGateway />}
        </main>
      </div>

      {/* Global Styles for simple animations */}
      <style dangerouslySetInnerHTML={{__html: `
        .fade-in { animation: fadeIn 0.3s ease-in-out; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}