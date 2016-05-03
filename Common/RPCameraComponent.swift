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
    static let CameraAreaTop: CGFloat = 500//100.0
    static let CameraAreaBottom: CGFloat = 0//250.0
}

struct RPCameraState : OptionSetType {
    
    let rawValue: Int
    
    static let MovingNorth  = RPCameraState(rawValue: 0)
    static let MovingEast   = RPCameraState(rawValue: 1 << 0)
    static let MovingSouth  = RPCameraState(rawValue: 1 << 1)
    static let MovingWest   = RPCameraState(rawValue: 1 << 2)
    static let Resting      = RPCameraState(rawValue: 1 << 3)
}

class RPCameraComponent: GKComponent {

    weak var node: RPNode?
    
    let cameraNode = SKCameraNode()
    
    var cameraOffset = CGPoint(x: 0.0, y: 0.0)
    var cameraPositionOld = CGPoint(x: 0.0, y: 0.0)
    var elapsedSeconds: NSTimeInterval = 0
    
    var cameraState = RPCameraState.Resting.rawValue
    
    init(focusedNode node: RPNode? = nil) {
        
        guard let node = node else {
            fatalError()
        }
        
        self.node = node
    }
    
    var deltaX: CGFloat {
        
        let areaBorderLeft = cameraOffset.x - RPCameraNodeSettings.AreaSizeHalf
        let areaBorderRight = cameraOffset.x + RPCameraNodeSettings.AreaSizeHalf
        
        var deltaX: CGFloat = 0.0
        
        if node!.position.x < areaBorderLeft {
            
            deltaX = node!.position.x - areaBorderLeft
            cameraOffset.x += deltaX
            cameraState = RPCameraState.MovingWest.rawValue
            
        } else if node!.position.x > areaBorderRight {
            
            deltaX = node!.position.x - areaBorderRight
            cameraOffset.x += deltaX
            cameraState = RPCameraState.MovingEast.rawValue
        }
        
        return deltaX
    }
    
    var deltaY: CGFloat {
        
        let areaBorderBottom = cameraOffset.y - RPCameraNodeSettings.CameraAreaBottom
        let areaBorderTop = cameraOffset.y + RPCameraNodeSettings.CameraAreaTop
        
        var deltaY: CGFloat = 0.0
        
        if node!.position.y < areaBorderBottom {
            
            deltaY = node!.position.y - areaBorderBottom
            cameraOffset.y += deltaY
            cameraState = RPCameraState.MovingSouth.rawValue
            
        } else if node!.position.y > areaBorderTop {
            
            deltaY = node!.position.y - areaBorderTop
            cameraOffset.y += deltaY
            cameraState = RPCameraState.MovingNorth.rawValue
        }
        
        return deltaY
    }

    override func updateWithDeltaTime(seconds: NSTimeInterval) {

        super.updateWithDeltaTime(seconds)

        let cameraPositionNew = CGPoint(x: cameraNode.position.x, y: cameraNode.position.y + deltaY)
        
        if cameraPositionNew != cameraPositionOld {
            
            //node!.parent?.position = cameraNode.parent!.position
            
            cameraNode.position = cameraPositionNew
            cameraPositionOld = cameraPositionNew
            
        } else {
            
            cameraState = RPCameraState.Resting.rawValue
        }
    }
}
