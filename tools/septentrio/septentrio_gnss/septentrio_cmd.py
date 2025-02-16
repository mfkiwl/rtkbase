#! /usr/bin/env python3
from . serial_comm import SerialComm
from enum import Enum
import logging
import xml.etree.ElementTree as ET
import time
#Code inspired by https://github.com/jonamat/sim-modem

logging.basicConfig(format='%(levelname)s: %(message)s')
log = logging.getLogger(__name__)
log.setLevel('ERROR')

class SeptGnss:
    """Class for sending command to Septentrio Gnss receivers
       Recommended use is on the ttyGNSS_CTRL port which doesn't receive
       any rtcm/raw data"""

    def __init__(
        self,
        address,
        baudrate=115200,
        timeout=2,
        cmd_delay=0.1,
        debug=False,
        ):
        self.comm = SerialComm(
            address=address,
            baudrate=baudrate,
            timeout=timeout,
            cmd_delay=cmd_delay,
            connection_descriptor='USB2>',
        )
        if debug:
            log.setLevel('DEBUG')
        self.connect()

    def connect(self) -> None:
        '''
            Check the connection to the Septentrio receiver
        '''
        log.debug("Connecting")
        try:
            self.comm.device_serial.reset_input_buffer()
            self.comm.send('exeEchoMessage, COM1, "A:HELLO", none')
            # The raw return should be
            #b'$R: exeEchoMessage, COM1, "A:HELLO", none\r\n  EchoMessage, COM1, "A:HELLO", none\r\nUSB2>'            
            read = self.comm.read_until_line("A:HELLO")
            read = self.comm.device_serial.readline() #line we don't need
            read = self.comm.read_raw(5) #reading next 5 chars to get connection descriptor
            res_descriptor = read.decode()
            check_descriptor = 'COM' in res_descriptor or 'USB' in res_descriptor or 'IP1' in res_descriptor
            if check_descriptor:
                self.comm.connection_descriptor = res_descriptor
            else:
                raise Exception
            log.debug("GNSS receiver connected, debug mode enabled")
            log.debug("Connection descriptor: {}".format(self.comm.connection_descriptor))
        except Exception as e:
            log.warning("GNSS receiver did not respond correctly")
            log.debug(read if read else "No response")
            log.debug("Exception: ", e)
            self.close()

    def close(self) -> None:
        log.debug("Closing connection")
        self.comm.close()
    
    def __enter__(self):
        return self
    
    def __exit__(self, exception_type, exception_value, exception_traceback):
        self.close()

    # --------------------------------- Common methods --------------------------------- #

    def get_receiver_model(self) -> str:
        read = self.send_read_until('lstInternalFile', 'Identification')
        model = self.__parse_rcv_info(read, 'hwplatform', 'product')
        return model

    def get_receiver_firmware(self) -> str:
        read = self.send_read_until('lstInternalFile', 'Identification')
        firmware = self.__parse_rcv_info(read, 'firmware', 'version')
        return firmware

    def get_receiver_ip(self) -> str:
        read = self.send_read_until('lstInternalFile', 'IPParameters')
        ip_addr = self.__parse_rcv_info(read, 'inet', 'addr')
        return ip_addr
    
    def __parse_rcv_info(self, pseudo_xml, element_tag, info) -> str:
        '''
           This methode will try to parse the xml file received
           when we send the lstInternalFile command
        '''
        pseudo_xml = [line for line in pseudo_xml[2:-1] if not (line.startswith('$') or line == '---->')]
        e = ET.ElementTree(ET.fromstring(''.join(pseudo_xml)))
        res_info = None
        for element in e.iter():
            log.debug(element.tag, element.attrib, element.text)
            res_info = element.get(info) if element_tag in element.tag and element.get(info) else res_info
        return res_info

    def get_port_applications(self, port) -> str:
        read = self.send_read_until('getRegisteredApplications', port)
        return read[-2].split(',')[-1].replace('"','').strip()
    
    def set_port_applications(self, port, applications_name) -> None:
        read = self.send_read_until('exeRegisteredApplications', port, applications_name)

    def set_factory_default(self) -> None:
        '''
           Reset receiver settings to factory defaults and restart it
           Connection will be closed
        '''
        log.debug("Sending: 'exeResetReceiver, Soft, Config'")
        self.comm.send('exeResetReceiver, Soft, Config')
        read = self.comm.read_until('STOP>')
        log.debug("Receiving: {}".format(read))
        if read[-1] != 'STOP>' or read[0].startswith('$R?'):
            raise Exception("Command failed!\nSent: 'exeResetReceiver, Soft, Config'\nReceived: {}".format(read))
        self.close()
        print("Connection closed")

    def send_config_file(self, file, perm=False) -> None:
        '''
           Send user commands from a txt file, line by line
           Set perm to True if you want to set these settings permanent
        '''
        with open(file, 'r') as f:
            for line in f:
                if line.strip() != '' and not line.startswith('#'):
                    cmd,*args = line.split(',')
                    #print(cmd, args)
                    self.send_read_until(cmd + ', ' + ', '.join(args))
        if perm:
            self.set_config_permanent()

    def set_config_permanent(self) -> None:
        '''
            Save current settings to boot config
        '''
        read = self.send_read_until('exeCopyConfigFile', 'Current', 'Boot')

    # ----------------------------------- OTHERS --------------------------------- #

    def send_read_lines(self, cmd, *args) -> list:
        log.debug("Sending: {}{}{}".format(cmd, ', ' if args else '', ', '.join(args)))
        self.comm.device_serial.reset_input_buffer()
        self.comm.send("{}{}{}".format(cmd, ', ' if args else '', ', '.join(args)))
        read = self.comm.read_lines()
        log.debug("Receiving: {}".format(read))
        if read[-1] != self.comm.connection_descriptor or read[0].startswith('$R?'):
            raise Exception("Command failed!\nSent: {}\nReceived: {}".format((cmd + ', ' + ', '.join(args)), read))
        return read

    def send_read_until(self, cmd, *args) -> list:
        log.debug("Sending: {}{}{}".format(cmd, ', ' if args else '', ', '.join(args)))
        self.comm.device_serial.reset_input_buffer()
        self.comm.send("{}{}{}".format(cmd, ', ' if args else '', ', '.join(args)))
        read = self.comm.read_until()
        log.debug("Receiving: {}".format(read))
        if read[-1] != self.comm.connection_descriptor or read[0].startswith('$R?'):
            raise Exception("Command failed!\nSent: {}\nReceived: {}".format((cmd + ', ' + ', '.join(args)), read))
        return read
