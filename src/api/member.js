import request from '@/utils/request'
export function fetchList(params) {
  return request({
    url:'/user/list',
    method:'get',
    params:params
  })
}
export function fetchPartList(params) {
  return request({
    url:'/user/simpleList',
    method:'get',
    params:params
  })
}
export function updateMember(flag,data) {
    return request({
      url:flag?'/user/create':'/user/update/'+data.id,
      method:'post',
      data:data
    })
}
export function updateStatus(data) {
  return request({
    url:'/user/update/status',
    method:'post',
    data:data
  })
}

export function deleteMember(id) {
  return request({
    url:'/user/update/delete/'+id,
    method:'post',
  })
}


