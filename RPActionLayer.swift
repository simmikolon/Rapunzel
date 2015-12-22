//
//  RPActionLayer.swift
//  RapunzelSwift
//
//  Created by Simon Kemper on 17.11.15.
//  Copyright © 2015 Simon Kemper. All rights reserved.
//

import SpriteKit

protocol RPActionLayerDelegate: class {
    
    func actionLayerDidFinishUpdatingCamera(withAbsolutePosition absolutePosition: CGPoint)
}

class RPActionLayer: RPLayer, InputHandlingNode, RPCameraNodeDelegate, RPPlayerDelegate {

    let cameraNode = RPCameraNode()
    let playerSpriteNode = RPPlayerSpriteNode(color: UIColor.whiteColor(), size: CGSize(width: 10.0, height: 10.0))
    
    weak var delegate: RPActionLayerDelegate?
    weak var cameraNodeDelegate: RPCameraNodeDelegate?
    //weak var playerDelegate: RPPlayerDelegate?
    
    override func setup() {
     
        func setupCameraNode() {
            
            cameraNode.delegate = self;
            cameraNode.setup()
            addChild(cameraNode)
        }
        
        func setupPlayer() {
            
            playerSpriteNode.setScale(2)
            playerSpriteNode.texture?.filteringMode = SKTextureFilteringMode.Nearest
            playerSpriteNode.delegate = self;
            playerSpriteNode.setup()
            addChild(playerSpriteNode)
            
            cameraNode.playerSpriteNode = playerSpriteNode
        }
     
        func addGround() {
            
            let ground = RPPlatformSpriteNode(color: UIColor.whiteColor(), size: CGSizeMake(1000, 32))
            ground.setup()
            ground.position = CGPointMake(0, 0)
            addChild(ground)
            
            let platform = RPPlatformSpriteNode(color: UIColor.whiteColor(), size: CGSizeMake(1500, 32))
            platform.setup()
            platform.position = CGPointMake(0, 300)
            addChild(platform)
        }
        
        func addPlatforms() {
            
            var index = CGFloat(2.0)
            var multi = CGFloat(200.0)
            
            func addPlatform() {
                
                let position: CGPoint
                
                let index_ = Int(index)
                
                if index_ % 2 == 0 {
                    
                    position = CGPointMake(120.0, index * multi)
                    
                } else {
                    
                    position = CGPointMake(-120.0, index * multi)
                }
                
                let platform = RPPlatformSpriteNode(color: UIColor.whiteColor(), size: CGSizeMake(100, 32))
                platform.setup()
                platform.position = position //CGPointMake(0.0, index * multi)
                addChild(platform)
                index += 1.0
            }
            
            for var index = 0; index < 50; ++index {
                
                addPlatform()
            }
        }
        
        setupCameraNode()
        setupPlayer()
        //addGround()
        //addPlatforms()
    }
    
    override func update(currentTime: NSTimeInterval) {
        playerSpriteNode.update(currentTime)
        cameraNode.update(currentTime)
    }
    
    override func didFinishUpdate() {
        cameraNode.didFinishUpdate()
    }
    
    func inputHandlerDidChangeMotion(xAcceleration: CGFloat) {
        playerSpriteNode.inputHandlerDidChangeMotion(xAcceleration)
    }
    
    func inputHandlerDidTap() {
        playerSpriteNode.inputHandlerDidTap()
    }
    
    func cameraNodeDidFinishUpdating(theCamera cameraNode: RPCameraNode) {
        cameraNodeDelegate?.cameraNodeDidFinishUpdating(theCamera: cameraNode)
    }
    
    func playerDidHit(thePlatform platform: RPPlatformSpriteNode) {
        
    }
    
    func playerDidJump(fromPlatform: RPPlatformSpriteNode, toPlatform: RPPlatformSpriteNode) {
        
    }
    
    func playerDidChange(velocity velocity: CGVector) {
        //playerDelegate?.playerDidChange(velocity: velocity)
    }
}
