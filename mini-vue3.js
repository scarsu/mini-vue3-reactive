const isObject = v=> v!==null && typeof v ==='object'

/* 建立响应式数据 */
function reactive(obj){
  // Proxy:http://es6.ruanyifeng.com/#docs/proxy
  // Proxy相当于在对象外层加拦截
  // Proxy递归是惰性的,需要添加递归的逻辑
  
  // Reflect:http://es6.ruanyifeng.com/#docs/reflect
  // Reflect:用于执行对象默认操作，更规范、更友好,可以理解成操作对象的合集
  // Proxy和Object的方法Reflect都有对应
  if(!isObject(obj)) return obj
  const observed = new Proxy(obj,{
    get(target, key, receiver){
      const ret = Reflect.get(target, key, receiver)
      console.log('getter '+ret)
      // 跟踪 收集依赖
      track(target, key)
      return reactive(ret)
    },
    set(target, key, val, receiver){
      const ret = Reflect.set(target, key, val, receiver)
      console.log('setter '+key+':'+val + '=>' + ret)
      // 触发更新
      trigger(target, key)
      return ret
    },
    deleteProperty(target, key){
      const ret = Reflect.deleteProperty(target, key)
      console.log('delete '+key+':'+ret)
      // 触发更新
      trigger(target, key)
      return ret
    },
  })
  return observed
}

/* 声明响应函数cb */
const effectStack = []
function effect(cb){

  // 对函数进行高阶封装
  const rxEffect = function(){
    // 1.捕获异常
    // 2.fn出栈入栈
    // 3.执行fn
    try{
      effectStack.push(rxEffect)
      return cb()
    }finally{
      effectStack.pop()
    }
  }

  // 最初要执行一次,进行最初的依赖收集
  rxEffect()

  return rxEffect
}

/* 依赖收集：建立 数据&cb 映射关系 */
const targetMap = new WeakMap()
function track(target,key){
  // 存入映射关系
  const effectFn = effectStack[effectStack.length - 1]  // 拿出栈顶函数
  if(effectFn){
    let depsMap = targetMap.get(target)
    if(!depsMap){
      depsMap = new Map()
      targetMap.set(target, depsMap)
    }
    let deps = depsMap.get(key)
    if(!deps){
      deps = new Set()
      depsMap.set(key, deps)
    }
    deps.add(effectFn)
  }
}

/* 触发更新：根据映射关系，执行cb */
function trigger(target, key){
  const depsMap = targetMap.get(target)
  if(depsMap){
    const deps = depsMap.get(key)
    if(deps){
      deps.forEach(effect=>effect())
    }
  }
}



// const state = reactive({foo:'foo', bar:{a:1}, arr:[1,2,3]})
// // effect里传入一个会触发getter的回调函数
// effect(()=>{
//   console.log(state.foo)
// })
// state.foo = 'bar'