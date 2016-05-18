//
//  ParticleSpriteNode.swift
//  Rapunzel
//
//  Created by Simon Kemper on 25.02.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit

func randomBetweenNumbers(firstNum: CGFloat, secondNum: CGFloat) -> CGFloat{
    return CGFloat(arc4random()) / CGFloat(UINT32_MAX) * abs(firstNum - secondNum) + min(firstNum, secondNum)
}

class ParticleSpriteNode: SpriteNode {
    
    var column: Int = 0
    var row: Int = 0
    var damping = CGFloat(20.0)
    var minAlpha: CGFloat = 0.0
    var maxAlpha: CGFloat = 1.0
    
    override func setup() {
        
        let body = SKPhysicsBody(rectangleOfSize: CGSize(width: 2.5, height: 2.5))
        body.affectedByGravity = true
        body.mass = 0.001
        body.linearDamping = damping
        body.categoryBitMask = 0
        body.contactTestBitMask = 0
        body.collisionBitMask = 0
        physicsBody = body
        
        self.alpha = 0.5
        
        //startBlink()
    }
    
    func startBlink() {
        
        let durationInterval = randomBetweenNumbers(0.0, secondNum: 5.0)
        let durationAction = SKAction.waitForDuration(NSTimeInterval(durationInterval))
        
        let fadeMinAction = SKAction.fadeAlphaTo(minAlpha, duration: 0.75)
        let fadeMaxAction = SKAction.fadeAlphaTo(maxAlpha, duration: 0.75)
        
        fadeMinAction.timingMode = SKActionTimingMode.EaseOut
        fadeMaxAction.timingMode = SKActionTimingMode.EaseIn
        
        let sequenceAction = SKAction.sequence([fadeMinAction, fadeMaxAction])
        let repeatAction = SKAction.repeatActionForever(sequenceAction)
        
        runAction(durationAction) { () -> Void in
            
            self.runAction(repeatAction)
        }
    }
}
