//
//  RPCameraNode.swift
//  RapunzelSwift
//
//  Created by Simon Kemper on 13.11.15.
//  Copyright © 2015 Simon Kemper. All rights reserved.
//

import SpriteKit

struct RPCameraNodeSettings {
    static let AreaSizeHalf: CGFloat = 80.0
    static let CameraFloatingOffsetDivider: CGFloat = 10.0
    static let CameraAreaTop: CGFloat = 100.0
    static let CameraAreaBottom: CGFloat = 250.0
}

protocol RPCameraNodeDelegate: class {
    func cameraNodeDidFinishUpdating(theCamera cameraNode: RPCameraNode)
}

class RPCameraNode: SKCameraNode, UpdateableNode {

    weak var delegate: RPCameraNodeDelegate?
    weak var playerSpriteNode: RPPlayerSpriteNode?
    
    var cameraOffset = CGPoint(x: 0.0, y: 0.0)
    var cameraPositionOld = CGPoint(x: 0.0, y: 0.0)
    
    func setup() {
        
    }
    
    func update(currentTime: NSTimeInterval) {
        
        func deltaX() -> CGFloat {
            
            let areaBorderLeft = cameraOffset.x - RPCameraNodeSettings.AreaSizeHalf
            let areaBorderRight = cameraOffset.x + RPCameraNodeSettings.AreaSizeHalf
            
            var deltaX: CGFloat = 0.0
            
            if playerSpriteNode!.position.x < areaBorderLeft {
                
                deltaX = playerSpriteNode!.position.x - areaBorderLeft
                cameraOffset.x += deltaX
                
            } else if playerSpriteNode!.position.x > areaBorderRight {
                
                deltaX = playerSpriteNode!.position.x - areaBorderRight
                cameraOffset.x += deltaX
            }
            
            return deltaX
        }
        
        func deltaY() -> CGFloat {
         
            let areaBorderBottom = cameraOffset.y - RPCameraNodeSettings.CameraAreaBottom
            let areaBorderTop = cameraOffset.y + RPCameraNodeSettings.CameraAreaTop
            
            var deltaY: CGFloat = 0.0
            
            if playerSpriteNode!.position.y < areaBorderBottom {
                
                deltaY = playerSpriteNode!.position.y - areaBorderBottom
                cameraOffset.y += deltaY
                
            } else if playerSpriteNode!.position.y > areaBorderTop {
                
                deltaY = playerSpriteNode!.position.y - areaBorderTop
                cameraOffset.y += deltaY
            }
            
            return deltaY
        }
        
        let cameraPositionNew = CGPoint(x: position.x + deltaX(), y: position.y + deltaY())
        
        if cameraPositionNew != cameraPositionOld {
            
            position = cameraPositionNew
            cameraPositionOld = cameraPositionNew
        }
    }
    
    func didFinishUpdate() {
        
        delegate?.cameraNodeDidFinishUpdating(theCamera: self)
    }
}
