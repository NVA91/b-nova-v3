"""
Device Manager for b-nova-v3 AI Service
Handles GPU/NPU detection and selection
"""

import os
import logging
import subprocess
from typing import Optional

import torch

logger = logging.getLogger(__name__)

class DeviceManager:
    """Manages compute device detection and selection"""
    
    def __init__(self):
        self.cuda_available = False
        self.rocm_available = False
        self.cuda_devices = []
        self.rocm_devices = []
        self.best_device = None
        
    def detect_devices(self):
        """Detect available compute devices"""
        logger.info("🔍 Detecting compute devices...")
        
        # Check CUDA (NVIDIA GPU)
        self._detect_cuda()
        
        # Check ROCm (AMD GPU/NPU)
        self._detect_rocm()
        
        # Select best device
        self._select_best_device()
        
    def _detect_cuda(self):
        """Detect NVIDIA CUDA devices"""
        self.cuda_available = torch.cuda.is_available()
        
        if self.cuda_available:
            device_count = torch.cuda.device_count()
            logger.info(f"✅ CUDA available: {device_count} device(s)")
            
            for i in range(device_count):
                device_name = torch.cuda.get_device_name(i)
                device_memory = torch.cuda.get_device_properties(i).total_memory / 1e9
                
                self.cuda_devices.append({
                    'id': i,
                    'name': device_name,
                    'memory_gb': round(device_memory, 2),
                    'type': 'cuda'
                })
                
                logger.info(f"  📊 Device {i}: {device_name} ({device_memory:.2f} GB)")
        else:
            logger.warning("⚠️  CUDA not available")
    
    def _detect_rocm(self):
        """Detect AMD ROCm devices"""
        try:
            # Check if rocm-smi is available
            result = subprocess.run(
                ['rocm-smi', '--showproductname'],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0:
                self.rocm_available = True
                logger.info("✅ ROCm available")
                
                # Parse device information
                lines = result.stdout.strip().split('\n')
                for i, line in enumerate(lines):
                    if 'GPU' in line or 'APU' in line:
                        self.rocm_devices.append({
                            'id': i,
                            'name': line.strip(),
                            'type': 'rocm'
                        })
                        logger.info(f"  📊 ROCm Device {i}: {line.strip()}")
            else:
                logger.warning("⚠️  ROCm not available")
                
        except (FileNotFoundError, subprocess.TimeoutExpired):
            logger.warning("⚠️  ROCm not available (rocm-smi not found)")
    
    def _select_best_device(self):
        """Select the best available device"""
        # Priority: CUDA > ROCm > CPU
        
        if self.cuda_available and self.cuda_devices:
            # Use NVIDIA GPU (RTX 5060 Ti)
            self.best_device = torch.device('cuda:0')
            logger.info(f"🎯 Selected device: {self.cuda_devices[0]['name']} (CUDA)")
            
        elif self.rocm_available and self.rocm_devices:
            # Use AMD GPU/NPU
            self.best_device = torch.device('cuda:0')  # ROCm uses CUDA API
            logger.info(f"🎯 Selected device: {self.rocm_devices[0]['name']} (ROCm)")
            
        else:
            # Fallback to CPU
            self.best_device = torch.device('cpu')
            logger.warning("⚠️  No GPU available, using CPU")
    
    def get_best_device(self) -> torch.device:
        """Get the best available device"""
        if self.best_device is None:
            self.detect_devices()
        return self.best_device
    
    def list_devices(self) -> dict:
        """List all available devices"""
        return {
            'cuda': {
                'available': self.cuda_available,
                'devices': self.cuda_devices
            },
            'rocm': {
                'available': self.rocm_available,
                'devices': self.rocm_devices
            }
        }
    
    def has_cuda(self) -> bool:
        """Check if CUDA is available"""
        return self.cuda_available
    
    def has_rocm(self) -> bool:
        """Check if ROCm is available"""
        return self.rocm_available
    
    def get_device_info(self) -> dict:
        """Get detailed device information"""
        info = {
            'current_device': str(self.best_device),
            'cuda_available': self.cuda_available,
            'rocm_available': self.rocm_available
        }
        
        if self.cuda_available:
            info['cuda_version'] = torch.version.cuda
            info['cudnn_version'] = torch.backends.cudnn.version()
        
        return info