//
//  RPPlayerSpriteNode.swift
//  RapunzelSwift
//
//  Created by Simon Kemper on 13.11.15.
//  Copyright © 2015 Simon Kemper. All rights reserved.
//

import SpriteKit

protocol RPPlayerDelegate: class {
    
    func playerDidHit(thePlatform platform: RPPlatformSpriteNode)
    func playerDidJump(fromPlatform: RPPlatformSpriteNode, toPlatform: RPPlatformSpriteNode)
    func playerDidChange(velocity velocity: CGVector)
}

class RPPlayerSpriteNode: RPSpriteNode, UpdateableNode, InputHandlingNode {

    weak var delegate: RPPlayerDelegate?
    weak var currentPlatform: RPPlatformSpriteNode?
    
    override func setup() {
     
        self.position = CGPointMake(0, 200);
        self.zPosition = -3
        setupPhysics()
    }
    
    func setupPhysics() {
        
        let physicsBody = SKPhysicsBody(rectangleOfSize: size)
        
        physicsBody.affectedByGravity = false //true
        physicsBody.dynamic = true
        physicsBody.categoryBitMask = RPCollisionCategoryBitMask.Player
        physicsBody.contactTestBitMask = RPCollisionCategoryBitMask.Platform
        physicsBody.collisionBitMask = RPCollisionCategoryBitMask.Platform
        physicsBody.usesPreciseCollisionDetection = true
        physicsBody.allowsRotation = false
        
        self.physicsBody = physicsBody;
    }
    
    override func didBeginContact(withNode node: SKNode) {
        
        if node.isKindOfClass(RPPlatformSpriteNode) {
            
            let platform = node as! RPPlatformSpriteNode
            delegate?.playerDidHit(thePlatform: platform)
            
            if physicsBody?.collisionBitMask != 0 {

                physicsBody?.velocity = CGVectorMake(physicsBody!.velocity.dx, 1000.0)
                
                if self.currentPlatform != platform {
                    
                    if let currentPlatform = self.currentPlatform {
                        
                        delegate?.playerDidJump(currentPlatform, toPlatform: platform)
                    }
                    
                    self.currentPlatform = platform
                }
            }
        }
    }
    
    func update(currentTime: NSTimeInterval) {
        
        self.delegate?.playerDidChange(velocity: physicsBody!.velocity)
        
        if physicsBody?.velocity.dy < 0 {
            
            physicsBody?.collisionBitMask = RPCollisionCategoryBitMask.Platform;
            
        } else {
            
            physicsBody?.collisionBitMask = 0;
        }
    }
    
    func didFinishUpdate() {
        
    }
    
    func inputHandlerDidChangeMotion(xAcceleration: CGFloat) {
    
        physicsBody?.velocity = CGVector(dx: xAcceleration, dy: physicsBody!.velocity.dy)
    }
    
    func inputHandlerDidTap() {

        //let newVelocity = physicsBody!.velocity.dy + 100.0
        //physicsBody?.velocity = CGVectorMake(physicsBody!.velocity.dx, newVelocity)
        
        runAction(SKAction.applyForce(CGVector(dx: 0.0, dy: 10.0), duration: 0.5))
    }
}
