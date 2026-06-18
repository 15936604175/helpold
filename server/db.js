// JSON 文件存储的数据库兼容层，替代 better-sqlite3
// 保持与 better-sqlite3 相同的 API：db.prepare(sql).get/all/run(...params)
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

// 表名 -> JSON 文件名映射
const TABLE_FILES = {
  users: 'users.json',
  user_locations: 'user_locations.json',
  helper_status: 'helper_status.json',
  helper_location_schedules: 'helper_location_schedules.json',
  help_requests: 'help_requests.json',
  help_candidates: 'help_candidates.json',
  guardian_relations: 'guardian_relations.json',
  location_tracking: 'location_tracking.json',
  location_history: 'location_history.json',
  geofence: 'geofence.json',
  geofence_alerts: 'geofence_alerts.json',
  push_notifications: 'push_notifications.json'
};

// 内存中的数据缓存
const tables = {};

// 加载所有表数据
function loadTables() {
  for (const [tableName, fileName] of Object.entries(TABLE_FILES)) {
    const filePath = path.join(DATA_DIR, fileName);
    try {
      if (fs.existsSync(filePath)) {
        tables[tableName] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } else {
        tables[tableName] = [];
        fs.writeFileSync(filePath, '[]');
      }
    } catch (e) {
      console.error(`加载表 ${tableName} 失败:`, e.message);
      tables[tableName] = [];
    }
  }
  console.log('JSON 数据库已加载');
}

// 保存指定表到文件
function saveTable(tableName) {
  const fileName = TABLE_FILES[tableName];
  if (!fileName) return;
  const filePath = path.join(DATA_DIR, fileName);
  try {
    fs.writeFileSync(filePath, JSON.stringify(tables[tableName] || [], null, 2));
  } catch (e) {
    console.error(`保存表 ${tableName} 失败:`, e.message);
  }
}

// 比较两个值，支持数字和字符串比较
// 用于 >, <, >=, <= 操作符
// 返回: -1 (a < b), 0 (a == b), 1 (a > b)
function compareValues(a, b) {
  const numA = Number(a);
  const numB = Number(b);
  // 如果两者都可以转为数字，用数字比较
  if (!isNaN(numA) && !isNaN(numB)) {
    if (numA < numB) return -1;
    if (numA > numB) return 1;
    return 0;
  }
  // 否则用字符串比较（适用于时间字符串如 "08:00" <= "15:48"）
  const strA = String(a);
  const strB = String(b);
  if (strA < strB) return -1;
  if (strA > strB) return 1;
  return 0;
}

// 解析 WHERE 条件，返回过滤函数
// 支持: col = ?, col = 'value', col = ? AND col2 = ?, col = ? OR col2 IN (?,?,?)
// 支持表别名前缀: u.id = ?, hr.status = 'pending'
// 支持: col > datetime('now','-5 minutes')
function parseWhere(whereClause, params, aliasMap) {
  if (!whereClause) return () => true;

  // 标准化：将别名前缀去掉，映射到实际字段名
  function resolveField(field) {
    field = field.trim();
    const parts = field.split('.');
    if (parts.length === 2) {
      return parts[1];
    }
    return field;
  }

  // 处理 datetime('now','-X minutes') 比较
  const datetimeMatch = whereClause.match(/(\w+(?:\.\w+)?)\s*(>|<|>=|<=)\s*datetime\('now','-(\d+)\s*minutes'\)/);
  let datetimeFilter = null;
  let cleanedWhere = whereClause;
  if (datetimeMatch) {
    const field = resolveField(datetimeMatch[1]);
    const op = datetimeMatch[2];
    const minutes = parseInt(datetimeMatch[3]);
    const threshold = Date.now() - minutes * 60 * 1000;
    datetimeFilter = (row) => {
      const val = row[field];
      if (!val) return false;
      const rowTime = new Date(val).getTime();
      if (op === '>') return rowTime > threshold;
      if (op === '<') return rowTime < threshold;
      if (op === '>=') return rowTime >= threshold;
      if (op === '<=') return rowTime <= threshold;
      return false;
    };
    cleanedWhere = whereClause.replace(datetimeMatch[0], '1=1');
  }

  // 分割 AND/OR 条件
  const orParts = cleanedWhere.split(/\s+OR\s+/i);
  const andGroups = orParts.map(part => part.split(/\s+AND\s+/i));

  // 预绑定参数：将条件中的 ? 替换为实际值，避免多行评估时参数索引错乱
  let paramIndex = 0;
  function bindValue(valueStr) {
    valueStr = valueStr.trim();
    if (valueStr === '?') {
      return params[paramIndex++];
    } else if (valueStr.startsWith("'") && valueStr.endsWith("'")) {
      return valueStr.slice(1, -1);
    } else if (valueStr.toUpperCase() === 'CURRENT_TIMESTAMP') {
      return new Date().toISOString();
    } else {
      return valueStr;
    }
  }

  // 预解析每个条件为 {field, op, value} 或 {field, op: 'IN', values}
  const parsedAndGroups = andGroups.map(andGroup => {
    return andGroup.map(condition => {
      condition = condition.trim();
      if (condition === '1=1' || condition === '') return { type: 'always_true' };

      // IN (?, ?, ...) 条件
      const inMatch = condition.match(/^(\w+(?:\.\w+)?)\s+IN\s*\(([^)]+)\)/i);
      if (inMatch) {
        const field = resolveField(inMatch[1]);
        const placeholders = inMatch[2].split(',').map(s => s.trim());
        const values = placeholders.map(p => {
          if (p === '?') return params[paramIndex++];
          if (p.startsWith("'") && p.endsWith("'")) return p.slice(1, -1);
          return p;
        });
        return { type: 'in', field, values };
      }

      // 比较条件: field op value
      // 注意: 长操作符(>=, <=, !=)必须在短操作符(>, <, =)之前匹配
      const compMatch = condition.match(/^(\w+(?:\.\w+)?)\s*(>=|<=|!=|=|>|<|LIKE)\s*(.+)$/i);
      if (compMatch) {
        const field = resolveField(compMatch[1]);
        const op = compMatch[2].toUpperCase();
        const value = bindValue(compMatch[3]);
        return { type: 'compare', field, op, value };
      }

      return { type: 'always_true' };
    });
  });

  function evalCondition(row, cond) {
    if (cond.type === 'always_true') return true;
    if (cond.type === 'in') {
      return cond.values.includes(row[cond.field]);
    }
    if (cond.type === 'compare') {
      const rowVal = row[cond.field];
      const value = cond.value;
      switch (cond.op) {
        case '=':
          if (typeof rowVal === 'number' && typeof value === 'string') {
            return rowVal === Number(value);
          }
          return rowVal == value;
        case '!=':
          return rowVal != value;
        case '>':
          return compareValues(rowVal, value) > 0;
        case '<':
          return compareValues(rowVal, value) < 0;
        case '>=':
          return compareValues(rowVal, value) >= 0;
        case '<=':
          return compareValues(rowVal, value) <= 0;
        case 'LIKE':
          // SQL LIKE: % 匹配任意字符序列, _ 匹配单个字符
          if (rowVal == null) return false;
          const pattern = String(value).replace(/%/g, '.*').replace(/_/g, '.');
          return new RegExp('^' + pattern + '$', 'i').test(String(rowVal));
        default:
          return false;
      }
    }
    return true;
  }

  return (row) => {
    if (datetimeFilter && !datetimeFilter(row)) return false;
    return parsedAndGroups.some(andGroup => andGroup.every(cond => evalCondition(row, cond)));
  };
}

// 解析 SELECT 查询
function executeSelect(sql, params) {
  // 提取 SELECT ... FROM ...（支持多行 SQL）
  // 注意：表别名不能是 SQL 关键字（WHERE, JOIN, LEFT, ORDER, LIMIT, ON, GROUP, HAVING）
  const selectMatch = sql.match(/^SELECT\s+([\s\S]+?)\s+FROM\s+(\w+)(?:\s+(?!WHERE|JOIN|LEFT|RIGHT|INNER|ORDER|LIMIT|ON|GROUP|HAVING|SET)(\w+))?([\s\S]*)$/i);
  if (!selectMatch) throw new Error('无法解析 SELECT: ' + sql);

  const selectCols = selectMatch[1].trim();
  const mainTable = selectMatch[2];
  const mainAlias = selectMatch[3] || mainTable;
  let rest = selectMatch[4] || '';

  let rows = [...(tables[mainTable] || [])];

  // 处理 JOIN（支持多行）
  const joinRegex = /(LEFT\s+JOIN|JOIN)\s+(\w+)(?:\s+(\w+))?\s+ON\s+([\s\S]+?)(?=(?:LEFT\s+JOIN|JOIN\s+|$))/gi;
  let joinMatch;
  const joins = [];
  while ((joinMatch = joinRegex.exec(rest)) !== null) {
    const joinType = joinMatch[1].toUpperCase();
    const joinTable = joinMatch[2];
    const joinAlias = joinMatch[3] || joinTable;
    const onClause = joinMatch[4].trim();
    joins.push({ type: joinType, table: joinTable, alias: joinAlias, on: onClause });
  }

  // 移除 JOIN 部分以解析剩余的 WHERE/ORDER/LIMIT
  let afterJoins = rest.replace(joinRegex, '');

  // 执行 JOIN
  if (joins.length > 0) {
    const joinedRows = [];
    for (const row of rows) {
      const combined = { ...row };
      let matchAll = true;
      for (const join of joins) {
        const joinData = tables[join.table] || [];
        // 解析 ON 条件: alias1.field1 = alias2.field2
        const onMatch = join.on.match(/(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/);
        let matched = null;
        if (onMatch) {
          const [, alias1, field1, alias2, field2] = onMatch;
          // 确定哪个是主表，哪个是join表
          let mainField, joinField;
          if (alias1 === join.alias) {
            joinField = field1;
            mainField = field2;
          } else {
            joinField = field2;
            mainField = field1;
          }
          matched = joinData.find(jr => jr[joinField] == combined[mainField]);
        }
        if (matched) {
          // 合并字段，添加别名前缀避免冲突
          for (const [k, v] of Object.entries(matched)) {
            if (!(k in combined)) {
              combined[k] = v;
            }
          }
        } else if (join.type === 'JOIN') {
          // INNER JOIN: 没匹配则跳过
          matchAll = false;
          break;
        }
        // LEFT JOIN: 没匹配则保留 null
      }
      if (matchAll) joinedRows.push(combined);
    }
    rows = joinedRows;
  }

  // 解析 WHERE（支持多行）
  const whereMatch = afterJoins.match(/WHERE\s+([\s\S]+?)(?:ORDER\s+BY|LIMIT|$)/i);
  if (whereMatch) {
    const whereFn = parseWhere(whereMatch[1].trim(), params, {});
    rows = rows.filter(whereFn);
  }

  // 解析 ORDER BY
  const orderMatch = afterJoins.match(/ORDER\s+BY\s+(\w+(?:\.\w+)?)(?:\s+(ASC|DESC))?/i);
  if (orderMatch) {
    let field = orderMatch[1];
    if (field.includes('.')) field = field.split('.')[1];
    const dir = (orderMatch[2] || 'ASC').toUpperCase();
    rows.sort((a, b) => {
      if (a[field] < b[field]) return dir === 'ASC' ? -1 : 1;
      if (a[field] > b[field]) return dir === 'ASC' ? 1 : -1;
      return 0;
    });
  }

  // 解析 LIMIT
  const limitMatch = afterJoins.match(/LIMIT\s+(\d+)/i);
  if (limitMatch) {
    rows = rows.slice(0, parseInt(limitMatch[1]));
  }

  // 处理 SELECT 列
  // COUNT(*) as c
  const countMatch = selectCols.match(/COUNT\(\*\)\s+as\s+(\w+)/i);
  if (countMatch) {
    return [{ [countMatch[1]]: rows.length }];
  }

  // 处理带别名的列: u.id, ul.latitude as ulat, hr.*, u.nickname as seeker_nickname
  if (selectCols === '*') {
    return rows;
  }

  // 解析列定义
  const colDefs = selectCols.split(',').map(c => c.trim());
  const colSpecs = colDefs.map(c => {
    // alias.field as outputName
    const asMatch = c.match(/^(\w+)\.(\w+|\*)\s+as\s+(\w+)$/i);
    if (asMatch) {
      return { table: asMatch[1], field: asMatch[2], output: asMatch[3] };
    }
    // alias.field
    const aliasMatch = c.match(/^(\w+)\.(\w+|\*)$/i);
    if (aliasMatch) {
      return { table: aliasMatch[1], field: aliasMatch[2], output: aliasMatch[2] };
    }
    // plain field
    return { table: null, field: c, output: c };
  });

  const result = rows.map(row => {
    const out = {};
    for (const spec of colSpecs) {
      if (spec.field === '*') {
        Object.assign(out, row);
      } else {
        out[spec.output] = row[spec.field];
      }
    }
    return out;
  });

  return result;
}

// 解析 INSERT 查询（支持多行）
function executeInsert(sql, params) {
  const match = sql.match(/INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
  if (!match) throw new Error('无法解析 INSERT: ' + sql);

  const table = match[1];
  const columns = match[2].split(',').map(c => c.trim());
  const placeholders = match[3].split(',').map(p => p.trim());

  const row = {};
  let paramIndex = 0;
  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    const ph = placeholders[i];
    if (ph === '?') {
      row[col] = params[paramIndex++];
    } else if (ph.toUpperCase() === 'CURRENT_TIMESTAMP') {
      row[col] = new Date().toISOString();
    } else if (ph.toUpperCase() === 'NULL') {
      row[col] = null;
    } else if (ph.startsWith("'") && ph.endsWith("'")) {
      row[col] = ph.slice(1, -1);
    } else {
      row[col] = ph;
    }
  }

  if (!tables[table]) tables[table] = [];
  tables[table].push(row);
  saveTable(table);

  return { changes: 1 };
}

// 解析 UPDATE 查询（支持多行）
function executeUpdate(sql, params) {
  const match = sql.match(/UPDATE\s+(\w+)\s+SET\s+([\s\S]+?)(?:\s+WHERE\s+([\s\S]+))?$/i);
  if (!match) throw new Error('无法解析 UPDATE: ' + sql);

  const table = match[1];
  const setClause = match[2];
  const whereClause = match[3];

  // 解析 SET 子句: col=?, col2=?, col3=CURRENT_TIMESTAMP
  const setParts = setClause.split(',').map(s => s.trim());
  const setSpecs = [];
  for (const part of setParts) {
    const setMatch = part.match(/^(\w+)\s*=\s*(.+)$/);
    if (setMatch) {
      setSpecs.push({ col: setMatch[1], value: setMatch[2].trim() });
    }
  }

  // 先收集 SET 参数，确定 WHERE 参数的起始位置
  let paramIndex = 0;
  const setValues = setSpecs.map(spec => {
    if (spec.value === '?') {
      return params[paramIndex++];
    } else if (spec.value.toUpperCase() === 'CURRENT_TIMESTAMP') {
      return new Date().toISOString();
    } else if (spec.value.toUpperCase() === 'NULL') {
      return null;
    } else if (spec.value.startsWith("'") && spec.value.endsWith("'")) {
      return spec.value.slice(1, -1);
    } else if (!isNaN(spec.value)) {
      return Number(spec.value);
    } else {
      return spec.value;
    }
  });

  // 用 WHERE 参数（SET 参数之后的参数）解析 WHERE 条件
  const whereParams = params.slice(paramIndex);
  const whereFn = parseWhere(whereClause, whereParams, {});

  let changes = 0;
  if (!tables[table]) tables[table] = [];

  for (const row of tables[table]) {
    if (whereFn(row)) {
      for (let i = 0; i < setSpecs.length; i++) {
        row[setSpecs[i].col] = setValues[i];
      }
      changes++;
    }
  }

  if (changes > 0) saveTable(table);
  return { changes };
}

// 解析 DELETE 查询（支持多行）
function executeDelete(sql, params) {
  const match = sql.match(/DELETE\s+FROM\s+(\w+)(?:\s+WHERE\s+([\s\S]+))?$/i);
  if (!match) throw new Error('无法解析 DELETE: ' + sql);

  const table = match[1];
  const whereClause = match[2];
  const whereFn = parseWhere(whereClause, params, {});

  const before = (tables[table] || []).length;
  tables[table] = (tables[table] || []).filter(row => !whereFn(row));
  const after = tables[table].length;

  if (before !== after) saveTable(table);
  return { changes: before - after };
}

// Statement 类，模拟 better-sqlite3 的 prepare 返回值
class Statement {
  constructor(sql) {
    this.sql = sql.trim();
    this.type = this.sql.split(/\s+/)[0].toUpperCase();
  }

  get(...params) {
    const rows = this._execute(params);
    return rows[0] || undefined;
  }

  all(...params) {
    return this._execute(params);
  }

  run(...params) {
    if (this.type === 'INSERT') return executeInsert(this.sql, params);
    if (this.type === 'UPDATE') return executeUpdate(this.sql, params);
    if (this.type === 'DELETE') return executeDelete(this.sql, params);
    return { changes: 0 };
  }

  _execute(params) {
    if (this.type === 'SELECT') {
      return executeSelect(this.sql, params);
    }
    return [];
  }
}

// JSON 数据库对象
const jsonDb = {
  prepare(sql) {
    return new Statement(sql);
  },
  pragma() {
    // no-op，兼容 better-sqlite3 的 pragma 调用
  },
  close() {
    // no-op
  }
};

// 初始化：加载所有表
loadTables();

module.exports = jsonDb;
