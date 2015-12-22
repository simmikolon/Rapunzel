//
//  RPGameScene.swift
//  RapunzelSwift
//
//  Created by Simon Kemper on 13.11.15.
//  Copyright © 2015 Simon Kemper. All rights reserved.
//

import SpriteKit
import UIKit

class RPGameScene: RPScene, InputHandlingNode {
    
    let worldNode = RPWorldNode()
    let contactDelegate = RPPhysicsWorldContactDelegate()
    let inputHandler = RPInputHandler()
    
    func UIColorFromRGB(rgbValue: UInt) -> UIColor {
        return UIColor(
            red: CGFloat((rgbValue & 0xFF0000) >> 16) / 255.0,
            green: CGFloat((rgbValue & 0x00FF00) >> 8) / 255.0,
            blue: CGFloat(rgbValue & 0x0000FF) / 255.0,
            alpha: CGFloat(1.0)
        )
    }
    
    override init(size: CGSize) {
        super.init(size: size)
        anchorPoint = CGPointMake(0.5,0.5)
        backgroundColor = UIColor.blackColor()//UIColorFromRGB(0x1D3C3F)
    }

    required init?(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)
    }
    
    override func setup() {
        
        setupInputHandler()
        setupPhysicsWorldContactDelegate()
        setupWorldNode()
    }
    
    private func setupInputHandler() {
        
        inputHandler.setup()
        inputHandler.delegate = self
    }
    
    private func setupPhysicsWorldContactDelegate() {
        
        contactDelegate.setup()
        physicsWorld.contactDelegate = contactDelegate
    }
    
    private func setupWorldNode() {
        
        addChild(worldNode)
        worldNode.setup()
    }
    
    private func addBackground() {
        
        for var index = 0; index < 10; ++index {
         
            let node = SKSpriteNode(imageNamed: "A_RPBackground")
            node.anchorPoint = CGPoint(x: 0.5, y: 0.5)
            node.zPosition = -5
            node.setScale(3.0)
            node.position = CGPoint(x: 0.0, y: node.size.height * CGFloat(index))
            addChild(node)
        }
    }
    
    override func update(currentTime: NSTimeInterval) {
        worldNode.update(currentTime)
    }

    override func didFinishUpdate() {
        worldNode.didFinishUpdate()
    }
}

extension RPGameScene {
    
    func inputHandlerDidChangeMotion(xAcceleration: CGFloat) {
        worldNode.inputHandlerDidChangeMotion(xAcceleration)
    }
    
    func inputHandlerDidTap() {
        worldNode.inputHandlerDidTap()
    }
}

extension RPGameScene {

    override func touchesBegan(touches: Set<UITouch>, withEvent event: UIEvent?) {
        inputHandler.touchesBegan(touches, withEvent: event, andView: self.view)
    }
    
    override func touchesMoved(touches: Set<UITouch>, withEvent event: UIEvent?) {
        inputHandler.touchesMoved(touches, withEvent: event, andView: self.view)
    }
    
    override func touchesEnded(touches: Set<UITouch>, withEvent event: UIEvent?) {
        inputHandler.touchesEnded(touches, withEvent: event, andView: self.view)
    }
}
