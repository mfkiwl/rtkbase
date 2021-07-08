#!/bin/bash
#
# run_cast.sh: script to run NTRIP caster by STR2STR
# You can read the RTKLIB manual for more str2str informations:
# https://github.com/tomojitakasu/RTKLIB

BASEDIR=$(dirname "$0")
source <( grep = ${BASEDIR}/settings.conf )  #import settings


in_serial="serial://${com_port}:${com_port_settings}#${receiver_format}"
in_tcp="tcpcli://127.0.0.1:${tcp_port}#${receiver_format}"
#in_ext_tcp is mainly for dev purpose to receive a raw stream from another base
in_ext_tcp="tcpcli://${ext_tcp_source}:${ext_tcp_port}#${receiver_format}"

out_caster="ntrips://:${svr_pwd}@${svr_addr}:${svr_port}/${mnt_name}#rtcm3 -msg ${rtcm_msg} -p ${position}"
#add receiver options if it exists
[[ ! -z "${ntrip_receiver_options}" ]] && out_caster=""${out_caster}" -opt "${ntrip_receiver_options}""

out_local_caster="ntripc://${local_ntripc_user}${local_ntripc_pwd}@:${local_ntripc_port}/${local_ntripc_mnt_name}#rtcm3 -msg ${local_ntripc_msg} -p ${position}"
#add receiver options if it exists
[[ ! -z "${local_ntripc_receiver_options}" ]] && out_local_caster=""${out_local_caster}" -opt "${local_ntripc_receiver_options}""

out_tcp="tcpsvr://:${tcp_port}"

out_file="file://${datadir}/${file_name}.${receiver_format}::T::S=${file_rotate_time} -f ${file_overlap_time}"

out_rtcm_svr="tcpsvr://:${rtcm_svr_port}#rtcm3 -msg ${rtcm_svr_msg} -p ${position}"
#add receiver options if it exists
[[ ! -z "${rtcm_receiver_options}" ]] && out_rtcm_svr=""${out_rtcm_svr}" -opt "${rtcm_receiver_options}""

out_rtcm_serial="serial://${out_com_port}:${out_com_port_settings}#rtcm3 -msg ${rtcm_serial_msg} -p ${position}"
#add receiver options if it exists
[[ ! -z "${rtcm_serial_receiver_options}" ]] && out_rtcm_serial=""${out_rtcm_serial}" -opt "${rtcm_serial_receiver_options}""

receiver_info="RTKBase ${receiver},${version}"

mkdir -p ${logdir}
    
  case "$2" in
    out_tcp)
    #echo ${cast} -in ${!1} -out $out_tcp
    # What is this ${!1} ? It's variable indirection
    ${cast} -in ${!1} -out ${out_tcp} -t ${level} -fl ${logdir}/str2str_tcp.log &
    ;;

  out_caster)
    #echo ${cast} -in ${!1} -out $out_caster
    ${cast} -in ${!1} -out ${out_caster} -i "${receiver_info}" -a "${antenna_info}" -t ${level} -fl ${logdir}/str2str_ntrip.log &
    ;;

  out_local_caster)
    #echo ${cast} -in ${!1} -out $out_local_caster
    ${cast} -in ${!1} -out ${out_local_caster} -i "${receiver_info}" -a "${antenna_info}" -t ${level} -fl ${logdir}/str2str_ntrip.log &
    ;;

  out_rtcm_svr)
    #echo ${cast} -in ${!1} -out $out_rtcm_svr
    ${cast} -in ${!1} -out ${out_rtcm_svr} -i "${receiver_info}" -a "${antenna_info}" -t ${level} -fl ${logdir}/str2str_rtcm_svr.log &
    ;;

  out_rtcm_serial)
    #echo ${cast} -in ${!1} -out $out_rtcm_serial
    ${cast} -in ${!1} -out ${out_rtcm_serial} -i "${receiver_info}" -a "${antenna_info}" -t ${level} -fl ${logdir}/str2str_rtcm_serial.log &
    ;;

  out_file)
    #echo ${cast} -in ${!1} -out $out_caster
    ${BASEDIR}/check_timesync.sh  #wait for a correct date/time before starting to write files
    ret=$?
    if [ ${ret} -eq 0 ]
    then
      mkdir -p ${datadir}
      ${cast} -in ${!1} -out ${out_file} -t ${level} -fl ${logdir}/str2str_file.log &
    fi
    ;;
    
  esac
