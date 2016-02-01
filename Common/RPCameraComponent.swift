//
//  RPCameraNode.swift
//  RapunzelSwift
//
//  Created by Simon Kemper on 13.11.15.
//  Copyright © 2015 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

struct RPCameraNodeSettings {
    
    static let AreaSizeHalf: CGFloat = 80.0
    static let CameraAreaTop: CGFloat = 100.0
    static let CameraAreaBottom: CGFloat = 250.0
}

class RPCameraComponent: GKComponent {

    weak var node: RPNode?
    
    let cameraNode = SKCameraNode()
    
    var cameraOffset = CGPoint(x: 0.0, y: 0.0)
    var cameraPositionOld = CGPoint(x: 0.0, y: 0.0)
    
    init(focusedNode node: RPNode? = nil) {
        
        self.node = node
    }
    
    override func updateWithDeltaTime(seconds: NSTimeInterval) {
        
        func deltaX() -> CGFloat {
            
            let areaBorderLeft = cameraOffset.x - RPCameraNodeSettings.AreaSizeHalf
            let areaBorderRight = cameraOffset.x + RPCameraNodeSettings.AreaSizeHalf
            
            var deltaX: CGFloat = 0.0
            
            if node!.position.x < areaBorderLeft {
                
                deltaX = node!.position.x - areaBorderLeft
                cameraOffset.x += deltaX
                
            } else if node!.position.x > areaBorderRight {
                
                deltaX = node!.position.x - areaBorderRight
                cameraOffset.x += deltaX
            }
            
            return deltaX
        }
        
        func deltaY() -> CGFloat {
            
            let areaBorderBottom = cameraOffset.y - RPCameraNodeSettings.CameraAreaBottom
            let areaBorderTop = cameraOffset.y + RPCameraNodeSettings.CameraAreaTop
            
            var deltaY: CGFloat = 0.0
            
            if node!.position.y < areaBorderBottom {
                
                deltaY = node!.position.y - areaBorderBottom
                cameraOffset.y += deltaY
                
            } else if node!.position.y > areaBorderTop {
                
                deltaY = node!.position.y - areaBorderTop
                cameraOffset.y += deltaY
            }
            
            return deltaY
        }
        
        let cameraPositionNew = CGPoint(x: cameraNode.position.x + deltaX(), y: cameraNode.position.y + deltaY())
        
        if cameraPositionNew != cameraPositionOld {
            
            cameraNode.position = cameraPositionNew
            cameraPositionOld = cameraPositionNew
        }
    }
}
